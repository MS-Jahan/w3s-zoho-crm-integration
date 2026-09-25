import { useEffect, useState } from 'react';
import { fetchLeadById } from '../services/api';

/**
 * Modal showing full details for a lead fetched by Record ID.
 */
export default function LeadDetailsModal({ leadId, onClose }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    fetchLeadById(leadId).then((result) => {
      setLoading(false);
      if (result.success) setLead(result.data);
      else setError(result);
    });
  }, [leadId]);

  if (!leadId) return null;

  return (
    <div className="modal modal-open animate-fade-in">
      <div className="modal-box max-w-2xl animate-scale-in">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-4">Lead Details</h3>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="loading loading-spinner loading-lg text-primary" />
            <p className="text-sm opacity-60">Fetching record from Zoho CRM…</p>
          </div>
        )}
        {!loading && error && (
          <div className="alert alert-error animate-scale-in">
            <div>
              <span className="font-mono text-xs">{error.code}</span>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}
        {!loading && lead && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
              <div><span className="font-semibold">Record ID:</span> <span className="font-mono text-xs">{lead.id}</span></div>
              <div><span className="font-semibold">Full Name:</span> {lead.fullName || '—'}</div>
              <div><span className="font-semibold">Email:</span> {lead.email || '—'}</div>
              <div><span className="font-semibold">Phone:</span> {lead.phone || '—'}</div>
              <div><span className="font-semibold">Company:</span> {lead.company || '—'}</div>
              <div><span className="font-semibold">Created:</span> {lead.createdTime || '—'}</div>
            </div>
            <details className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title text-sm font-medium">Full JSON payload</div>
              <div className="collapse-content">
                <pre className="text-xs overflow-x-auto">{JSON.stringify(lead, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
