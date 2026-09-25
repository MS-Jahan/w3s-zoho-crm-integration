import { useState } from 'react';
import { Copy, Check, Inbox, Search, Trash2, Building2, RotateCcw, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from './Skeleton.jsx';
import { deleteLead } from '../services/api';

/**
 * Leads table with search, company filter, pagination, edit and delete actions.
 * Record IDs are copyable; emails are mailto links.
 */
export default function LeadTable({ leads, loading, onView, onRefresh, onError, onSuccess, onEdit, pagination }) {
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Client-side instant filtering (also supported server-side via ?search= &company=)
  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (l.fullName || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.id || '').toLowerCase().includes(q);
    const matchCompany = !company || (l.company || '').toLowerCase().includes(company.toLowerCase());
    return matchSearch && matchCompany;
  });

  const companies = [...new Set(leads.map((l) => l.company).filter(Boolean))].sort();

  function copyId(id) {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleDelete(lead) {
    if (!window.confirm(`Delete lead "${lead.fullName}" (${lead.id}) from Zoho CRM? This cannot be undone.`)) return;
    setDeletingId(lead.id);
    const result = await deleteLead(lead.id);
    setDeletingId(null);
    if (result.success) {
      onSuccess(`Lead "${lead.fullName}" deleted`);
      onRefresh(false); // refresh without toast
    } else {
      onError(result);
    }
  }

  const hasFilters = search || company;
  const page = pagination?.page || 1;
  const canPrev = page > 1;
  const canNext = !!pagination?.moreRecords;

  function changePage(delta) {
    onRefresh(false, { page: page + delta });
  }

  return (
    <div className="card bg-base-100 shadow-md animate-slide-up stagger-2">
      <div className="card-body">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title text-lg">
            CRM Leads
            {!loading && (
              <span className="badge badge-ghost badge-sm">{filtered.length}{hasFilters && ` of ${leads.length}`}</span>
            )}
          </h2>
          {/* Search + filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="input input-bordered input-sm flex items-center gap-2 focus-within:input-primary transition-colors">
              <Search className="h-3.5 w-3.5 opacity-50" />
              <input
                type="text"
                className="grow w-36"
                placeholder="Search name, email, ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label className="input input-bordered input-sm flex items-center gap-2 focus-within:input-primary transition-colors">
              <Building2 className="h-3.5 w-3.5 opacity-50" />
              <input
                type="text"
                className="grow w-28"
                placeholder="Filter company…"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                list="company-list"
              />
              <datalist id="company-list">
                {companies.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
            {hasFilters && (
              <button
                className="btn btn-ghost btn-sm btn-square"
                onClick={() => { setSearch(''); setCompany(''); }}
                aria-label="Clear filters"
                title="Clear filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center gap-2 py-10 opacity-60">
                        <Inbox className="h-10 w-10" />
                        <p className="font-medium">{hasFilters ? 'No matches' : 'No leads yet'}</p>
                        <p className="text-sm">
                          {hasFilters ? 'Try adjusting or clearing the filters.' : 'Create your first lead using the form on the left.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead, i) => (
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
                        <div className="inline-flex items-center gap-1">
                          <button className="btn btn-ghost btn-xs text-primary transition-transform hover:scale-105" onClick={() => onView(lead.id)}>
                            View Record
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-info/60 hover:text-info hover:bg-info/10 transition-colors"
                            onClick={() => onEdit(lead.id)}
                            aria-label={`Edit lead ${lead.fullName}`}
                            title="Edit lead"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-error/60 hover:text-error hover:bg-error/10 transition-colors"
                            onClick={() => handleDelete(lead)}
                            disabled={deletingId === lead.id}
                            aria-label={`Delete lead ${lead.fullName}`}
                            title="Delete lead"
                          >
                            {deletingId === lead.id ? <span className="loading loading-spinner loading-xs" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {pagination && (
          <div className="flex items-center justify-between border-t border-base-200 pt-3 mt-2">
            <p className="text-xs opacity-60">
              Page {page} {pagination.moreRecords ? '· more records available' : '· last page'}
            </p>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-ghost" onClick={() => changePage(-1)} disabled={!canPrev || loading}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="badge badge-ghost badge-sm font-mono">{page}</span>
              <button className="btn btn-sm btn-ghost" onClick={() => changePage(1)} disabled={!canNext || loading}>
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
