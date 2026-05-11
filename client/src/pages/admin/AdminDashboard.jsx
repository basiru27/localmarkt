import { Link } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useAdmin';
import SvgSparkline from '../../components/SvgSparkline';
import { formatRelativeDate } from '../../lib/utils';

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
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Listings Chart */}
        <div className="lg:col-span-2 card-static p-5 flex flex-col">
          <h3 className="text-lg font-bold text-text mb-4">New Listings per Day (Last 14 Days)</h3>
          <div className="flex-1 mt-2">
            <SvgSparkline 
              data={data?.listings_chart || []} 
              height={240} 
              dataKey="count" 
              labelKey="listings"
              color="#0B6E4F" 
            />
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="card-static p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text">Recent Admin Actions</h3>
            <Link to="/admin/logs" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            {!data?.recent_logs || data.recent_logs.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No recent actions found.</p>
            ) : (
              data.recent_logs.map((log) => (
                <div key={log.id} className="text-sm border-b border-border-light pb-3 last:border-0 last:pb-0">
                  <p className="text-text-secondary text-xs mb-0.5">
                    {formatRelativeDate(log.created_at)}
                  </p>
                  <p className="text-text leading-tight">
                    <span className="font-medium">{log.admin?.display_name || 'Admin'}</span>
                    {' · '}
                    <span className="text-primary">{log.action}</span>
                    {' · '}
                    <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{log.target_type}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
