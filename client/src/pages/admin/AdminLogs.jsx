import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminLogs } from '../../hooks/useAdmin';
import { formatRelativeDate } from '../../lib/utils';
import Pagination from '../../components/ui/Pagination';

export default function AdminLogs() {
  useDocumentTitle('System Logs');

  const { isSuperAdmin } = useAuth();
  
  const [filterAdmin, setFilterAdmin] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Collect options globally from the unfiltered response
  const { data: unfilteredData } = useAdminLogs({ limit: 100 }, isSuperAdmin);
  const unfilteredLogs = useMemo(() => unfilteredData?.data || [], [unfilteredData]);
  
  const admins = useMemo(() => {
    if (!unfilteredLogs) return [];
    const map = new Map();
    unfilteredLogs.forEach(log => {
      if (log.admin_id) map.set(log.admin_id, log.admin?.display_name || log.admin_id);
    });
    return Array.from(map.entries());
  }, [unfilteredLogs]);

  const actions = useMemo(() => {
    if (!unfilteredLogs) return [];
    return Array.from(new Set(unfilteredLogs.map(l => l.action))).sort();
  }, [unfilteredLogs]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [filterAdmin, filterAction, dateFrom, dateTo]);

  const filters = useMemo(() => {
    const next = { page, limit: 20 };
    if (filterAdmin) next.admin_id = filterAdmin;
    if (filterAction) next.action = filterAction;
    if (dateFrom) next.date_from = dateFrom;
    if (dateTo) next.date_to = dateTo;
    return next;
  }, [filterAdmin, filterAction, dateFrom, dateTo, page]);

  const { data, isLoading, isError, error } = useAdminLogs(filters, isSuperAdmin);
  const logs = data?.data || [];
  const pagination = data?.pagination;

  const exportCSV = () => {
    if (!logs || logs.length === 0) return;
    const headers = ['When', 'Admin', 'Action', 'Target Type', 'Target ID', 'Details'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.admin?.display_name || log.admin_id,
      log.action,
      log.target_type,
      log.target_id,
      JSON.stringify(log.details || {})
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDetails = (details) => {
    if (!details || Object.keys(details).length === 0) {
      return "—";
    }
    
    if (details.status) {
      return `Status set to: ${details.status.charAt(0).toUpperCase() + details.status.slice(1)}`;
    }
    
    if ('moderation_note' in details) {
      if (details.moderation_note) {
        return `Reason: ${details.moderation_note}`;
      } else {
        return "No note added";
      }
    }

    if ('is_banned' in details) {
      return `Status set to: ${details.is_banned ? 'Banned' : 'Active'}`;
    }
    
    return (
      <pre className="text-xs whitespace-pre-wrap font-mono bg-gray-50 rounded p-2 border border-border-light">
        {JSON.stringify(details, null, 2)}
      </pre>
    );
  };

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

      <div className="card-static p-4 flex flex-col md:flex-row flex-wrap gap-3 items-end">
        <div className="flex-1 w-full md:w-auto min-w-[150px]">
          <label className="text-xs text-text-secondary mb-1 block">All admins</label>
          <select value={filterAdmin} onChange={(e) => setFilterAdmin(e.target.value)} className="input text-sm">
            <option value="">All admins</option>
            {admins.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 w-full md:w-auto min-w-[150px]">
          <label className="text-xs text-text-secondary mb-1 block">All actions</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="input text-sm">
            <option value="">All actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-auto flex gap-3">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input text-sm" />
          </div>
        </div>

        <div className="w-full md:w-auto ml-auto">
          <button onClick={exportCSV} className="btn-secondary whitespace-nowrap h-[42px] px-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Export CSV
          </button>
        </div>
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
                  <td className="p-3 text-text-secondary max-w-xs break-words">
                    {renderDetails(entry.details)}
                  </td>
                </tr>
              ))}

              {logs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-text-secondary">
                    No audit logs found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {pagination && (
            <div className="px-4 pb-4">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}