import { Users, CalendarPlus, Activity } from 'lucide-react';

/**
 * Dashboard stat cards: Total Leads, Created Today, API status.
 */
export default function StatsCards({ totalLeads, createdToday, apiOk, loading }) {
  const stats = [
    { label: 'Total Leads', value: totalLeads ?? '—', icon: Users, color: 'text-primary' },
    { label: 'Created Today', value: createdToday ?? '—', icon: CalendarPlus, color: 'text-success' },
    { label: 'API Status', value: apiOk ? 'Healthy' : 'Down', icon: Activity, color: apiOk ? 'text-success' : 'text-error' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card bg-base-100 shadow-md">
          <div className="card-body p-4 flex-row items-center gap-3">
            <div className={`rounded-lg bg-base-200 p-2 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs opacity-60">{label}</p>
              <p className="text-lg font-bold leading-tight">{loading ? '…' : value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
