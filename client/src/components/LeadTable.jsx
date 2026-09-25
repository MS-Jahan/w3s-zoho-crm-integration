import { useState } from 'react';
import { Copy, Check, Inbox } from 'lucide-react';
import { SkeletonTable } from './Skeleton.jsx';

/**
 * Leads table: Record ID (with copy), Full Name, Email, Company, Actions.
 * Shows shimmering skeleton rows while loading.
 */
export default function LeadTable({ leads, loading, onView }) {
  const [copiedId, setCopiedId] = useState(null);

  function copyId(id) {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="card bg-base-100 shadow-md animate-slide-up stagger-2">
      <div className="card-body">
        <h2 className="card-title text-lg">CRM Leads</h2>
        <div className="overflow-x-auto">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center gap-2 py-10 opacity-60">
                        <Inbox className="h-10 w-10" />
                        <p className="font-medium">No leads yet</p>
                        <p className="text-sm">Create your first lead using the form on the left.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, i) => (
                    <tr key={lead.id} className="animate-fade-in hover:bg-base-200/70" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="font-mono text-xs">{lead.id}</span>
                          <button
                            className="btn btn-ghost btn-xs btn-square opacity-50 hover:opacity-100"
                            onClick={() => copyId(lead.id)}
                            aria-label={`Copy ID ${lead.id}`}
                            title="Copy Record ID"
                          >
                            {copiedId === lead.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </span>
                      </td>
                      <td className="font-medium">{lead.fullName}</td>
                      <td className="text-xs">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="link link-hover link-primary">{lead.email}</a>
                        ) : '—'}
                      </td>
                      <td>{lead.company || '—'}</td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-xs text-primary transition-transform hover:scale-105" onClick={() => onView(lead.id)}>
                          View Record
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
