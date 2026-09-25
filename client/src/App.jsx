import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import LeadForm from './components/LeadForm.jsx';
import LeadTable from './components/LeadTable.jsx';
import LeadDetailsModal from './components/LeadDetailsModal.jsx';
import LeadEditModal from './components/LeadEditModal.jsx';
import ErrorSimulator from './components/ErrorSimulator.jsx';
import StatsCards from './components/StatsCards.jsx';
import { fetchLeads, checkHealth } from './services/api';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to <html data-theme>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  /** Push a toast; auto-dismisses after 4.5s. */
  const addToast = useCallback((type, code, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, type, code, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const showError = useCallback(
    (err) => addToast('error', err.code || 'ERROR', err.message || 'Request failed'),
    [addToast]
  );

  const loadLeads = useCallback(async (showToast = true, opts = {}) => {
    const targetPage = opts.page !== undefined ? opts.page : (opts.resetPage ? 1 : page);
    if (opts.page !== undefined || opts.resetPage) setPage(opts.page ?? 1);
    setLoading(true);
    const result = await fetchLeads({ page: targetPage, per_page: 25 });
    setLoading(false);
    if (result.success) {
      setLeads(result.data);
      setPagination(result.pagination);
      setConnected(true);
      if (showToast) addToast('success', 'OK', `Loaded ${result.count} lead(s) from Zoho CRM`);
    } else {
      setConnected(false);
      showError(result);
    }
  }, [addToast, showError, page]);

  useEffect(() => {      checkHealth().then((r) => setConnected(!!r.success));
    loadLeads(false); // auto-load leads on first paint (no toast)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(data) {
    addToast('success', 'LEAD_CREATED', `Lead created with Record ID: ${data.id}`);
    loadLeads(false, { resetPage: true });
    setSelectedLeadId(data.id); // verify by fetching the record back by ID
  }

  const today = new Date().toISOString().slice(0, 10);
  const createdToday = leads.filter((l) => (l.createdTime || '').slice(0, 10) === today).length;

  return (
    <div className="min-h-screen bg-base-300 p-4 md:p-6 flex flex-col">
      <Navbar
        connected={connected}
        loading={loading}
        onRefresh={loadLeads}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <StatsCards totalLeads={leads.length} createdToday={createdToday} apiOk={connected} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 flex-1">
        <div className="lg:col-span-1 space-y-4">
          <LeadForm onCreated={handleCreated} onError={showError} />
          <ErrorSimulator onError={showError} />
        </div>
        <div className="lg:col-span-2">
          <LeadTable
            leads={leads}
            loading={loading}
            onView={setSelectedLeadId}
            onRefresh={loadLeads}
            onError={showError}
            onSuccess={(m) => addToast('success', 'DELETED', m)}
            onEdit={setEditingLeadId}
            pagination={pagination}
          />
        </div>
      </div>

      <footer className="text-center text-xs opacity-50 py-4">
        Zoho CRM Integration Dashboard · Express + React + DaisyUI
      </footer>

      {selectedLeadId && (
        <LeadDetailsModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}

      {editingLeadId && (
        <LeadEditModal
          leadId={editingLeadId}
          onClose={() => setEditingLeadId(null)}
          onSaved={(msg) => {
            setEditingLeadId(null);
            addToast('success', 'LEAD_UPDATED', msg);
            loadLeads(false);
          }}
          onError={showError}
        />
      )}

      {/* Toast stack */}
      <div className="toast toast-end z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${t.type === 'success' ? 'alert-success' : 'alert-error'} animate-slide-in-right shadow-lg`}>
            {t.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
            <div>
              <span className="font-mono text-xs font-bold">{t.code}</span>
              <p className="text-sm whitespace-pre-wrap">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
