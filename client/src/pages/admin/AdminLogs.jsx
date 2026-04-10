import { useAuth } from '../../context/AuthContext';
import { useAdminLogs } from '../../hooks/useAdmin';
import { formatRelativeDate } from '../../lib/utils';

export default function AdminLogs() {
  const { isSuperAdmin } = useAuth();
  const { data: logs, isLoading, isError, error } = useAdminLogs(isSuperAdmin);

  if (!isSuperAdmin) {
    return (
      <div className="card-static p-5">
        <h2 className="font-semibold text-text mb-2">Audit Logs</h2>
        <p className="text-sm text-text-secondary">Only super admins can view audit logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">Audit Logs</h2>
        <p className="text-text-secondary">Immutable record of admin actions across the platform.</p>
      </div>

      {isLoading && (
        <div className="card-static p-5">
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="skeleton h-10 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="card-static p-5" role="alert">
          <p className="text-sm text-error">{error?.message || 'Failed to load audit logs'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="card-static overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-border-light">
              <tr>
                <th className="text-left p-3 font-semibold text-text">When</th>
                <th className="text-left p-3 font-semibold text-text">Admin</th>
                <th className="text-left p-3 font-semibold text-text">Action</th>
                <th className="text-left p-3 font-semibold text-text">Target</th>
                <th className="text-left p-3 font-semibold text-text">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((entry) => (
                <tr key={entry.id} className="border-b border-border-light last:border-b-0 align-top">
                  <td className="p-3 text-text-secondary whitespace-nowrap">{formatRelativeDate(entry.created_at)}</td>
                  <td className="p-3 text-text">{entry.admin?.display_name || entry.admin_id}</td>
                  <td className="p-3">
                    <span className="badge-secondary uppercase tracking-wide">{entry.action}</span>
                  </td>
                  <td className="p-3 text-text-secondary">
                    {entry.target_type}:{' '}
                    <span className="font-mono text-xs">{entry.target_id?.slice(0, 8)}</span>
                  </td>
                  <td className="p-3 text-text-secondary">
                    <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-50 rounded p-2 border border-border-light">
                      {JSON.stringify(entry.details || {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}

              {logs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-text-secondary">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
