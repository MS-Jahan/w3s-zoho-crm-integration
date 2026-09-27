import { Users, UserPlus, Activity, ShieldCheck, ShieldAlert } from 'lucide-react';
import { SkeletonStat } from './Skeleton.jsx';

/**
 * Metrics overview cards (studio style): gradient icon badges, bold counts,
 * token health badge from the /api/health payload.
 */
export default function StatsCards({ totalLeads, createdToday, health, loading }) {
  if (loading && !totalLeads) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SkeletonStat /><SkeletonStat /><SkeletonStat />
      </div>
    );
  }

  const tokenOk = !!health?.tokenCache?.hasToken;
  const apiOk = health ? !!health.zohoConfigured : false;

  const stats = [
    {
      label: 'Total Leads',
      value: totalLeads ?? 0,
      sub: 'Synched from CRM',
      icon: Users,
      badge: 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25',
    },
    {
      label: 'Ingested Today',
      value: createdToday ?? 0,
      sub: 'Local session creations',
      icon: UserPlus,
      badge: 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map(({ label, value, sub, icon: Icon, badge }) => (
        <div
          key={label}
          className="card bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-md transition-all duration-200 hover:border-base-content/20"
        >
          <div className="card-body p-4 flex-row items-center gap-3.5">
            <div className={`rounded-xl p-2.5 text-white ${badge}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-base-content/50 font-medium">{label}</p>
              <p className="text-2xl font-bold leading-tight">{value}</p>
              <p className="text-[11px] text-base-content/40">{sub}</p>
            </div>
          </div>
        </div>
      ))}

      {/* API Health card */}
      <div className="card bg-base-100/70 backdrop-blur-md border border-base-content/10 shadow-md transition-all duration-200 hover:border-base-content/20">
        <div className="card-body p-4 flex-row items-center gap-3.5">
          <div className={`rounded-xl p-2.5 text-white bg-gradient-to-br ${apiOk ? 'from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25' : 'from-rose-500 to-red-600 shadow-lg shadow-rose-500/25'}`}>
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-base-content/50 font-medium flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {apiOk && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOk ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              </span>
              API Health
            </p>
            <p className="text-lg font-bold leading-tight">{apiOk ? 'Healthy' : 'Degraded'}</p>
            <p className={`text-[11px] inline-flex items-center gap-1 ${apiOk ? 'text-emerald-400' : 'text-rose-400'}`}>
              {apiOk ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              {tokenOk
                ? `Token Valid · Auto Refresh ON (${Math.round((health.tokenCache.expiresInSec || 0) / 60)}m)`
                : apiOk
                  ? 'Configured · Auto Refresh Ready'
                  : 'API Not Configured'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
