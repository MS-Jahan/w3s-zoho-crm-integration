import { useState } from 'react';

/**
 * Navbar with system status badge and manual lead refresh.
 */
export default function Navbar({ connected, loading, onRefresh }) {
  return (
    <div className="navbar bg-base-200 shadow-md rounded-box mb-6">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 15l4-4 3 3 5-6" />
          </svg>
          <div>
            <h1 className="text-xl font-bold">Zoho CRM Dashboard</h1>
            <p className="text-xs opacity-60">Lead management via Zoho CRM API</p>
          </div>
        </div>
      </div>
      <div className="flex-none flex items-center gap-3">
        <span className={`badge ${connected ? 'badge-success' : 'badge-error'} gap-2`}>
          <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-error'} animate-pulse`} />
          {connected ? 'Connected to Zoho CRM' : 'Disconnected'}
        </span>
        <button className="btn btn-primary btn-sm" onClick={onRefresh} disabled={loading}>
          {loading ? <span className="loading loading-spinner loading-xs" /> : 'Refresh Leads'}
        </button>
      </div>
    </div>
  );
}
