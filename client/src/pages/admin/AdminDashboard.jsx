import { useAdminStats } from '../../hooks/useAdmin';

function StatCard({ label, value, hint }) {
  return (
    <div className="card-static p-4 sm:p-5">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="text-3xl font-bold text-text mt-1">{value}</p>
      {hint && <p className="text-xs text-text-muted mt-2">{hint}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading, isError, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="card-static p-5">
            <div className="skeleton h-4 w-28 mb-3" />
            <div className="skeleton h-9 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-static p-5" role="alert">
        <h2 className="font-semibold text-text mb-2">Failed to load admin stats</h2>
        <p className="text-sm text-text-secondary">{error?.message || 'Please try again.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">Dashboard</h2>
        <p className="text-text-secondary">Moderation and platform health overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Users" value={data?.users_total || 0} />
        <StatCard label="Banned Users" value={data?.users_banned || 0} hint="Soft-banned accounts" />
        <StatCard label="Total Listings" value={data?.listings_total || 0} />
        <StatCard label="Pending Listings" value={data?.listings_pending || 0} hint="Awaiting approval" />
        <StatCard label="Pending Reports" value={data?.reports_pending || 0} hint="Needs moderator action" />
      </div>
    </div>
  );
}
