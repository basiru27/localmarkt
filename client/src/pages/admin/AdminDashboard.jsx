import { useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Link } from 'react-router-dom';
import { useAdminStats } from '../../hooks/useAdmin';
import SvgSparkline from '../../components/SvgSparkline';
import { formatRelativeDate } from '../../lib/utils';

function StatCard({ label, value, hint, to }) {
  const inner = (
    <>
      <p className="text-sm text-[#6B6B6B]">{label}</p>
      <p className="text-3xl font-bold text-[#1A1A1A] mt-1">{value}</p>
      {hint && <p className="text-xs text-[#94a3b8] mt-2">{hint}</p>}
    </>
  );

  const className = "block bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition hover:scale-[1.02] active:scale-[0.98]";

  if (to) {
    return <Link to={to} className={className}>{inner}</Link>;
  }

  return <div className={className}>{inner}</div>;
}

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard');
  const [chartDays, setChartDays] = useState(14);

  const { data, isLoading, isError, error } = useAdminStats(chartDays);

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'APPROVE_LISTING':
      case 'UNBAN_USER':
        return 'bg-green-100 text-green-800';
      case 'REJECT_LISTING':
      case 'BAN_USER':
        return 'bg-red-100 text-red-800';
      case 'REMOVE_LISTING':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <StatCard label="Total Users" value={data?.users_total || 0} to="/admin/users" />
        <StatCard label="Banned Users" value={data?.users_banned || 0} hint="Soft-banned accounts" to="/admin/users?banned=true" />
        <StatCard label="Total Listings" value={data?.listings_total || 0} to="/admin/listings" />
        <StatCard label="Pending Listings" value={data?.listings_pending || 0} hint="Awaiting approval" to="/admin/listings?status=pending" />
        <StatCard label="Pending Reports" value={data?.reports_pending || 0} hint="Needs moderator action" to="/admin/reports?status=pending" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Listings Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">New Listings per Day</h3>
            <select 
              value={chartDays} 
              onChange={(e) => setChartDays(Number(e.target.value))}
              className="text-sm border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          <div className="flex-1 mt-2">
            {!data?.listings_chart || data.listings_chart.every(d => d.count === 0) ? (
              <div className="h-full flex items-center justify-center text-text-muted text-sm pb-8">
                No listing activity in the last {chartDays} days.
              </div>
            ) : (
              <SvgSparkline 
                data={data.listings_chart} 
                height={240} 
                dataKey="count" 
                labelKey="listings"
                color="#C8622A"
                showTooltip={true}
              />
            )}
          </div>
          
          {/* Quick Actions */}
          {(data?.listings_pending > 0 || data?.reports_pending > 0 || data?.disputes_pending > 0) && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-medium text-text mb-3">Quick Actions</h4>
              <div className="flex flex-wrap gap-3">
                {data?.listings_pending > 0 && (
                  <Link to="/admin/listings?status=pending" className="btn-outline text-[#C8622A] border-[#C8622A] hover:bg-[#C8622A]/5 text-sm py-1.5 px-3 rounded-lg flex items-center gap-2">
                    Review Pending Listings
                    <span className="bg-[#C8622A] text-white text-xs px-1.5 py-0.5 rounded-full">{data.listings_pending}</span>
                  </Link>
                )}
                {data?.disputes_pending > 0 && (
                  <Link to="/admin/disputes" className="btn-outline text-[#C8622A] border-[#C8622A] hover:bg-[#C8622A]/5 text-sm py-1.5 px-3 rounded-lg flex items-center gap-2">
                    Resolve Disputes
                    <span className="bg-[#C8622A] text-white text-xs px-1.5 py-0.5 rounded-full">{data.disputes_pending}</span>
                  </Link>
                )}
                {data?.reports_pending > 0 && (
                  <Link to="/admin/reports" className="btn-outline text-[#C8622A] border-[#C8622A] hover:bg-[#C8622A]/5 text-sm py-1.5 px-3 rounded-lg flex items-center gap-2">
                    View Reports
                    <span className="bg-[#C8622A] text-white text-xs px-1.5 py-0.5 rounded-full">{data.reports_pending}</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Admin Actions */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-5 flex flex-col">
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
                  <p className="text-text-secondary text-xs mb-1">
                    {formatRelativeDate(log.created_at)}
                  </p>
                  <p className="text-text leading-tight flex items-center flex-wrap gap-1.5">
                    <span className="font-medium">{log.admin?.display_name || 'Admin'}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {log.target_type}
                    </span>
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
