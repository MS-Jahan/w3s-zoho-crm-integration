import { simulateError } from '../services/api';

const SCENARIOS = [
  {
    type: 'token',
    label: 'Simulate Invalid/Expired Token',
    description: 'Forces a 401 authentication error',
  },
  {
    type: 'field',
    label: 'Simulate Missing Required Field',
    description: 'Submits payload without Last_Name → 400 MANDATORY_NOT_FOUND',
  },
  {
    type: 'module',
    label: 'Simulate Invalid Module',
    description: 'Calls /crm/v3/InvalidModuleName → 404',
  },
];

/**
 * Error Testing Panel: triggers handled API errors for the demo.
 */
export default function ErrorSimulator({ onError }) {
  async function trigger(type) {
    const result = await simulateError(type);
    // These requests are expected to fail; show the error toast either way.
    if (!result.success) onError(result);
  }

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body gap-3">
        <div>
          <h2 className="card-title text-lg">Error Testing Panel</h2>
          <p className="text-xs opacity-60">Triggers handled API errors to demonstrate error responses.</p>
        </div>
        {SCENARIOS.map((s) => (
          <button key={s.type} className="btn btn-outline btn-error btn-sm justify-start" onClick={() => trigger(s.type)}>
            {s.label}
            <span className="ml-auto text-xs opacity-60 hidden md:inline">{s.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
