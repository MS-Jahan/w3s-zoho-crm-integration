import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { fetchLeadById } from '../services/api';

/** Detail row with muted "Not set in CRM" placeholder for empty values. */
function DetailRow({ label, value, mono = false }) {
  const isSet = value !== null && value !== undefined && String(value).trim() !== '';
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs uppercase tracking-wider text-base-content/40 sm:w-24 shrink-0">{label}</span>
      {isSet ? (
        <span className={`text-sm break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
      ) : (
        <span className="text-xs italic text-base-content/30">Not set in CRM</span>
      )}
    </div>
  );
}

/**
 * Lead details modal: Lead Info + Zoho System Metadata sections,
 * JSON payload toggle, "Open in Zoho CRM" deep link when CRM UI domain is known.
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

  // Optional deep link — only when the operator configured the org UI domain.
  const crmBase = import.meta.env.VITE_ZOHO_CRM_UI_DOMAIN; // e.g. https://crm.zoho.com/crm/org/12345678/tab/Leads
  const crmUrl = crmBase && lead ? `${crmBase.replace(/\/$/, '')}/${lead.id}` : null;

  return (
    <div className="modal modal-open animate-fade-in">
      <div className="modal-box max-w-2xl bg-base-100 border border-base-content/10 animate-scale-in">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <h3 className="font-bold text-lg mb-4">Lead Details</h3>
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <span className="loading loading-spinner loading-lg text-indigo-400" />
            <p className="text-sm text-base-content/50">Fetching record from Zoho CRM…</p>
          </div>
        )}
        {!loading && error && (
          <div className="alert alert-error bg-rose-500/10 border-rose-500/30 text-rose-300 animate-scale-in">
            <div>
              <span className="font-mono text-xs font-bold">{error.code}</span>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        )}
        {!loading && lead && (
          <div className="space-y-4">
            <section>
              <h4 className="text-[11px] uppercase tracking-wider text-base-content/40 mb-2">Lead Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-base-300/40 rounded-lg p-3 border border-base-content/[0.06]">
                <DetailRow label="Record ID" value={lead.id} mono />
                <DetailRow label="Full Name" value={lead.fullName} />
                <DetailRow label="First Name" value={lead.firstName} />
                <DetailRow label="Last Name" value={lead.lastName} />
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="Phone" value={lead.phone} />
                <DetailRow label="Mobile" value={lead.mobile} />
                <DetailRow label="Company" value={lead.company} />
              </div>
            </section>

            <section>
              <h4 className="text-[11px] uppercase tracking-wider text-base-content/40 mb-2">Zoho System Metadata</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-base-300/40 rounded-lg p-3 border border-base-content/[0.06]">
                <DetailRow label="Lead Status" value={lead.leadStatus} />
                <DetailRow label="Lead Source" value={lead.leadSource} />
                <DetailRow label="Industry" value={lead.industry} />
                <DetailRow label="Website" value={lead.website} />
                <DetailRow label="Owner" value={lead.owner} />
                <DetailRow label="Created" value={lead.createdTime} mono />
                <DetailRow label="Modified" value={lead.modifiedTime} mono />
              </div>
            </section>

            {/* JSON viewer toggle */}
            <div className="border border-base-content/10 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-base-content/[0.04] transition-colors"
                onClick={() => setShowJson((v) => !v)}
              >
                <span className="font-mono text-xs text-base-content/60">{"{ }"} JSON Payload</span>
                <span className={`transition-transform duration-200 text-base-content/40 ${showJson ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {showJson && (
                <pre className="text-[11px] overflow-x-auto px-3 pb-3 text-base-content/60 animate-fade-in">{JSON.stringify(lead, null, 2)}</pre>
              )}
            </div>

            {crmUrl && (
              <a
                href={crmUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-300 link link-hover"
              >
                <ExternalLink className="h-3 w-3" /> Open in Zoho CRM
              </a>
            )}
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
