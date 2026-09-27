import { ShieldAlert, Terminal } from 'lucide-react';
import { simulateError } from '../services/api';

const SCENARIOS = [
  { type: 'token', label: 'Simulate 401 Unauthorized', sub: 'Expired / invalid token', code: '401 INVALID_TOKEN', badge: 'badge-error' },
  { type: 'field', label: 'Simulate 400 Bad Request', sub: 'Missing mandatory field', code: '400 MANDATORY_NOT_FOUND', badge: 'badge-warning' },
  { type: 'module', label: 'Simulate 400 · Invalid Module', sub: 'Invalid CRM module (Zoho returns HTTP 400)', code: '400 INVALID_MODULE', badge: 'badge-error' },
];

/**
 * Developer Sandbox: triggers handled Zoho API errors; results surface as toasts.
 */
export default function ErrorTester({ onError }) {
  async function trigger(type) {
    const result = await simulateError(type);
    // Expected to fail — show the handled error toast either way.
    if (!result.success) onError(result);
  }

  return (
    <div className="card bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-md animate-slide-up stagger-3">
      <div className="card-body gap-3 p-5">
        <div>
          <h2 className="card-title text-base gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-orange-600 shadow-lg shadow-rose-500/20 flex items-center justify-center">
              <Terminal className="h-3.5 w-3.5 text-white" />
            </span>
            Developer Sandbox
          </h2>
          <p className="text-xs text-base-content/50">Simulate and verify backend error handling for edge cases.</p>
        </div>
        {SCENARIOS.map((s) => (
          <button
            key={s.type}
            className="group flex items-center justify-between gap-2 w-full rounded-lg border border-base-content/10 bg-base-300/40 px-3 py-2.5 text-left transition-all duration-200 hover:border-rose-500/40 hover:bg-rose-500/5 active:scale-[0.98]"
            onClick={() => trigger(s.type)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium group-hover:text-rose-300 transition-colors">{s.label}</span>
              <span className="block text-[11px] text-base-content/40">{s.sub}</span>
            </span>
            <span className={`badge badge-sm font-mono text-[10px] whitespace-nowrap ${s.badge}`}>{s.code}</span>
          </button>
        ))}
        <p className="text-[10px] text-base-content/30 flex items-center gap-1">
          <ShieldAlert className="h-3 w-3" /> Responses are handled — the UI never crashes.
        </p>
      </div>
    </div>
  );
}
