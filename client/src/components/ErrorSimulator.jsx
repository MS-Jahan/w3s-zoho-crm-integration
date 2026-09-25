import { AlertTriangle } from 'lucide-react';
import { simulateError } from '../services/api';

const SCENARIOS = [
  { type: 'token', label: 'Invalid / Expired Token', code: '401 · INVALID_TOKEN' },
  { type: 'field', label: 'Missing Required Field', code: '400 · MANDATORY_NOT_FOUND' },
  { type: 'module', label: 'Invalid Module', code: '400 · INVALID_MODULE' },
];

/**
 * Error Testing Panel ("danger zone"): triggers handled API errors for the demo.
 */
export default function ErrorSimulator({ onError }) {
  async function trigger(type) {
    const result = await simulateError(type);
    // These requests are expected to fail; show the error toast either way.
    if (!result.success) onError(result);
  }

  return (
    <div className="card bg-base-100 shadow-md border border-error/20 animate-slide-up stagger-3">
      <div className="card-body gap-3">
        <div>
          <h2 className="card-title text-lg gap-2">
            <AlertTriangle className="h-5 w-5 text-error" /> Error Testing Panel
          </h2>
          <p className="text-xs opacity-60">Triggers handled API errors to demonstrate error responses.</p>
        </div>
        {SCENARIOS.map((s) => (
          <button
            key={s.type}
            className="btn btn-outline btn-error btn-sm justify-between transition-transform active:scale-[0.98]"
            onClick={() => trigger(s.type)}
          >
            <span>{s.label}</span>
            <span className="badge badge-error badge-outline badge-sm font-mono text-[10px]">{s.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
