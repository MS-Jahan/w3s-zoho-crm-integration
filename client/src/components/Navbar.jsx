import { Moon, Sun } from 'lucide-react';

/**
 * Navbar with system status badge, theme toggle, and lead refresh.
 */
export default function Navbar({ connected, loading, onRefresh, theme, onToggleTheme }) {
  return (
    <div className="navbar bg-base-200 shadow-md rounded-box mb-4">
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
          {connected && <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>}
          {connected ? 'Connected to Zoho CRM' : 'Disconnected'}
        </span>
        <button
          className="btn btn-ghost btn-sm btn-circle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle light/dark theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="btn btn-primary btn-sm" onClick={onRefresh} disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs" /> Refreshing…
            </>
          ) : (
            'Refresh Leads'
          )}
        </button>
      </div>
    </div>
  );
}
