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
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h3 className="font-bold text-lg mb-4">Lead Details</h3>
        {loading && <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>}
        {!loading && error && (
          <div className="alert alert-error">
            <div>
              <span className="font-mono text-xs">{error.code}</span>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}
        {!loading && lead && (
          <div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div><span className="font-semibold">Record ID:</span> <span className="font-mono text-xs">{lead.id}</span></div>
              <div><span className="font-semibold">Full Name:</span> {lead.fullName || '—'}</div>
              <div><span className="font-semibold">Email:</span> {lead.email || '—'}</div>
              <div><span className="font-semibold">Phone:</span> {lead.phone || '—'}</div>
              <div><span className="font-semibold">Company:</span> {lead.company || '—'}</div>
              <div><span className="font-semibold">Created:</span> {lead.createdTime || '—'}</div>
            </div>
            <details className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" defaultChecked />
              <div className="collapse-title text-sm font-medium">Raw JSON</div>
              <div className="collapse-content">
                <pre className="text-xs overflow-x-auto">{JSON.stringify(lead.raw, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
