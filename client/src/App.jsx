import { useCallback, useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import LeadForm from './components/LeadForm.jsx';
import LeadTable from './components/LeadTable.jsx';
import LeadDetailsModal from './components/LeadDetailsModal.jsx';
import ErrorSimulator from './components/ErrorSimulator.jsx';
import { fetchLeads, checkHealth } from './services/api';

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [toasts, setToasts] = useState([]);

  /** Push a toast; auto-dismisses after 5s. */
  const addToast = useCallback((type, code, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, code, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const showError = useCallback(
    (err) => addToast('error', err.code || 'ERROR', err.message || 'Request failed'),
    [addToast]
  );

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const result = await fetchLeads();
    setLoading(false);
    if (result.success) {
      setLeads(result.data);
      setConnected(true);
      addToast('success', 'OK', `Loaded ${result.count} lead(s) from Zoho CRM`);
    } else {
      setConnected(false);
      showError(result);
    }
  }, [addToast, showError]);

  useEffect(() => {
    // Check backend health on mount to set the status badge
    checkHealth().then((r) => setConnected(!!r.success));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(data) {
    addToast('success', 'LEAD_CREATED', `Lead created with Record ID: ${data.id}`);
    loadLeads();
    setSelectedLeadId(data.id); // verify by fetching the record back by ID
  }

  return (
    <div className="min-h-screen bg-base-300 p-4 md:p-6">
      <Navbar connected={connected} loading={loading} onRefresh={loadLeads} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <LeadForm onCreated={handleCreated} onError={showError} />
          <ErrorSimulator onError={showError} />
        </div>
        <div className="lg:col-span-2">
          <LeadTable leads={leads} loading={loading} onView={setSelectedLeadId} />
        </div>
      </div>

      {selectedLeadId && (
        <LeadDetailsModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}

      {/* Toast stack */}
      <div className="toast toast-end z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`alert ${t.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            <div>
              <span className="font-mono text-xs font-bold">{t.code}</span>
              <p className="text-sm">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
