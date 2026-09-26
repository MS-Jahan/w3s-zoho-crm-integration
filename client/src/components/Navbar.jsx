import { Moon, Sun, RefreshCw } from 'lucide-react';
import { useState } from 'react';

/**
 * Studio navbar: logo + product title, OAuth status pill with glowing ping,
 * refresh button with spinning sync icon, theme toggle.
 */
export default function Navbar({ connected, loading, onRefresh, theme, onToggleTheme }) {
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 1200);
  }

  return (
    <div className="navbar sticky top-0 z-40 bg-base-300/80 backdrop-blur-md border-b border-base-content/10 rounded-box px-4 mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3v18h18" strokeLinecap="round" />
              <path d="M7 15l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Zoho CRM Studio</h1>
            <p className="text-[11px] text-base-content/50 -mt-0.5">Real-time Lead Ingestion & OAuth Sync</p>
          </div>
        </div>
      </div>
      <div className="flex-none flex items-center gap-2.5">
        {/* OAuth status pill */}
        <div
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {connected && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          )}
          Zoho OAuth: {connected ? 'Active' : 'Down'}
        </div>

        <button
          className="btn btn-sm btn-ghost btn-circle"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          className="btn btn-sm border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all duration-200"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${spinning || loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing…' : 'Refresh Records'}
        </button>
      </div>
    </div>
  );
}
