/** Skeleton building blocks for loading states. */

export function SkeletonLine({ className = '' }) {
  return <div className={`skeleton-shimmer h-4 rounded bg-base-300 ${className}`} />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-[1.4fr_1fr_1.4fr_1fr_0.6fr] items-center gap-3">
          <SkeletonLine className="h-3" />
          <SkeletonLine />
          <SkeletonLine className="h-3" />
          <SkeletonLine />
          <SkeletonLine className="h-6 w-16 justify-self-end" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="h-8" />
        </div>
      ))}
      <SkeletonLine className="h-9 w-full" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body p-4 space-y-2">
        <SkeletonLine className="h-3 w-16" />
        <SkeletonLine className="h-7 w-12" />
      </div>
    </div>
  );
}
