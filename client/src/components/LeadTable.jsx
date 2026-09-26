import { useState } from 'react';
import { Copy, Check, Inbox, Search, Trash2, RotateCcw, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from './Skeleton.jsx';
import { deleteLead } from '../services/api';

/** Deterministic pastel gradient from lead name for the initials avatar. */
function avatarStyle(name) {
  const hues = ['from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-orange-600', 'from-sky-500 to-cyan-600', 'from-fuchsia-500 to-pink-600', 'from-amber-500 to-yellow-600'];
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return hues[hash % hues.length];
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

/**
 * CRM Leads Management table: search toolbar, avatars, company pills,
 * copy ID, edit/delete actions, pagination with page-size selector.
 */
export default function LeadTable({
  leads, loading, onView, onRefresh, onError, onSuccess, onEdit, pagination, pageSize, onPageSizeChange,
  searchInput, onSearchChange,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = leads; // search is server-side (Zoho criteria), debounced in App

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
      onRefresh(false);
    } else {
      onError(result);
    }
  }

  const page = pagination?.page || 1;
  const canPrev = page > 1;
  const canNext = !!pagination?.moreRecords;
  const hasFilters = !!searchInput;

  return (
    <div className="card bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-md animate-slide-up stagger-2">
      <div className="card-body p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="card-title text-base">
            Leads Management
            {!loading && (
              <span className="badge badge-sm bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-mono">{filtered.length}</span>
            )}
            {loading && <span className="loading loading-spinner loading-xs text-indigo-400" />}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="input input-sm flex items-center gap-2 bg-base-300/50 border-base-content/15 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-200">
              <Search className="h-3.5 w-3.5 opacity-40" />
              <input
                type="text"
                className="grow w-40"
                placeholder="Search name, email, company…"
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {hasFilters && (
                <button onClick={() => onSearchChange('')} aria-label="Clear search" className="opacity-50 hover:opacity-100">
                  <RotateCcw className="h-3 w-3" />
                </button>
              )}
            </label>
            {/* Page size selector */}
            <select
              className="select select-sm bg-base-300/50 border-base-content/15 focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Records per page"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-1">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : (
            <table className="table table-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-base-content/50 border-base-content/10">
                  <th>Lead</th>
                  <th>Record ID</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <div className="flex flex-col items-center gap-2 py-12 text-base-content/40">
                        <div className="w-14 h-14 rounded-2xl bg-base-content/5 flex items-center justify-center">
                          <Inbox className="h-7 w-7" />
                        </div>
                        <p className="font-medium text-base-content/60">{hasFilters ? 'No matches' : 'No leads yet'}</p>
                        <p className="text-sm">{hasFilters ? 'Try adjusting the search.' : 'Create your first lead using the form on the left.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead, i) => (
                    <tr key={lead.id} className="animate-fade-in hover:bg-base-content/[0.04] border-base-content/[0.06] transition-colors" style={{ animationDelay: `${i * 30}ms` }}>
                      {/* Avatar + name */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarStyle(lead.fullName)} flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-md`}>
                            {initials(lead.fullName)}
                          </div>
                          <span className="font-semibold text-sm">{lead.fullName}</span>
                        </div>
                      </td>
                      {/* Record ID mono + copy */}
                      <td>
                        <div className="inline-flex items-center gap-1.5" title={lead.id}>
                          <span className="font-mono text-xs text-base-content/60">{lead.id.slice(0, 12)}…</span>
                          <button
                            className="btn btn-ghost btn-xs btn-square opacity-40 hover:opacity-100"
                            onClick={() => copyId(lead.id)}
                            aria-label={`Copy ID ${lead.id}`}
                          >
                            {copiedId === lead.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="text-xs">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="link link-hover text-base-content/70 hover:text-indigo-300 transition-colors">{lead.email}</a>
                        ) : <span className="italic text-base-content/30 text-xs">Not set</span>}
                      </td>
                      <td>
                        {lead.company ? (
                          <span className="badge badge-sm bg-base-content/[0.06] border-base-content/10 text-base-content/70 font-normal">{lead.company}</span>
                        ) : <span className="italic text-base-content/30 text-xs">Not set</span>}
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            className="btn btn-ghost btn-xs text-indigo-300 hover:bg-indigo-500/10 transition-all duration-200"
                            onClick={() => onView(lead.id)}
                          >
                            View Details
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-sky-400/60 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                            onClick={() => onEdit(lead.id)}
                            aria-label={`Edit lead ${lead.fullName}`}
                            title="Edit lead"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs btn-square text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-base-content/10 pt-3 mt-2">
            <p className="text-xs text-base-content/40">
              Page <span className="font-mono text-base-content/70">{page}</span>
              {pagination.moreRecords ? ' · more records available' : ' · last page'}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                className="btn btn-sm btn-ghost border-base-content/10 hover:border-indigo-500/40 disabled:opacity-30 transition-all duration-200"
                onClick={() => onRefresh(false, { page: page - 1 })}
                disabled={!canPrev || loading}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="badge badge-sm bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-mono">{page}</span>
              <button
                className="btn btn-sm btn-ghost border-base-content/10 hover:border-indigo-500/40 disabled:opacity-30 transition-all duration-200"
                onClick={() => onRefresh(false, { page: page + 1 })}
                disabled={!canNext || loading}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
