import { useEffect, useState } from 'react';
import { fetchLeadById } from '../services/api';

/** A detail row: shows value or a muted "Not set in CRM" placeholder. */
function DetailRow({ label, value, mono = false }) {
  const isSet = value !== null && value !== undefined && String(value).trim() !== '';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
      <span className="font-semibold sm:w-28 shrink-0">{label}:</span>
      {isSet ? (
        <span className={mono ? 'font-mono text-xs break-all' : 'break-words'}>{value}</span>
      ) : (
        <span className="italic opacity-40 text-xs">Not set in CRM</span>
      )}
    </div>
  );
}

/**
 * Modal showing full details for a lead fetched by Record ID.
 * Empty CRM fields render a muted placeholder instead of blank space.
 */
export default function LeadDetailsModal({ leadId, onClose }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    setError(null);
    setShowJson(false);
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
            {/* Lead Info */}
            <div className="mb-3">
              <h4 className="text-xs tracking-wider uppercase opacity-50 mb-2">Lead Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm bg-base-200/60 rounded-lg p-3">
                <DetailRow label="Record ID" value={lead.id} mono />
                <DetailRow label="Full Name" value={lead.fullName} />
                <DetailRow label="First Name" value={lead.firstName} />
                <DetailRow label="Last Name" value={lead.lastName} />
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="Phone" value={lead.phone} />
                <DetailRow label="Mobile" value={lead.mobile} />
                <DetailRow label="Company" value={lead.company} />
              </div>
            </div>

            {/* Zoho System Metadata */}
            <div className="mb-3">
              <h4 className="text-xs tracking-wider uppercase opacity-50 mb-2">Zoho System Metadata</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm bg-base-200/60 rounded-lg p-3">
                <DetailRow label="Lead Status" value={lead.leadStatus} />
                <DetailRow label="Lead Source" value={lead.leadSource} />
                <DetailRow label="Industry" value={lead.industry} />
                <DetailRow label="Website" value={lead.website} />
                <DetailRow label="Owner" value={lead.owner} />
                <DetailRow label="Created" value={lead.createdTime} mono />
                <DetailRow label="Modified" value={lead.modifiedTime} mono />
              </div>
            </div>

            {/* JSON viewer toggle */}
            <div className="border border-base-300 rounded-lg">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-base-200/60 transition-colors rounded-lg"
                onClick={() => setShowJson((v) => !v)}
              >
                <span>JSON Payload</span>
                <span className={`transition-transform duration-200 ${showJson ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {showJson && (
                <pre className="text-xs overflow-x-auto px-3 pb-3 animate-fade-in">{JSON.stringify(lead, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
