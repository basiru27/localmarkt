import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useMemo, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminReports, useUpdateReportStatus, useExportReports, adminKeys } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { formatRelativeDate, exportToCSV } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import Pagination from '../../components/ui/Pagination';

export default function AdminReports() {
  useDocumentTitle('Review Reports');

  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [statusFilter]);

  const filters = useMemo(() => {
    const next = { page, limit: 20 };
    if (statusFilter !== 'all') next.status = statusFilter;
    return next;
  }, [statusFilter, page]);

  const { data, isLoading, isError, error } = useAdminReports(filters);
  const reports = data?.data || [];
  const pagination = data?.pagination;
  const updateReportMutation = useUpdateReportStatus();
  const { refetch: exportReports, isRefetching: isExporting } = useExportReports();

  const handleExportCSV = async () => {
    try {
      const result = await exportReports();
      if (result.data?.data) {
        exportToCSV(result.data.data, [
          { key: 'id', label: 'ID' },
          { key: 'reason', label: 'Reason' },
          { key: 'details', label: 'Details' },
          { key: 'status', label: 'Status' },
          { accessor: (r) => r.reporter?.display_name || r.reporter_id, label: 'Reporter' },
          { accessor: (r) => r.listing?.title || '', label: 'Listing' },
          { accessor: (r) => r.reported_user?.display_name || r.reported_user_id || '', label: 'Reported User' },
          { key: 'created_at', label: 'Created' },
        ], `reports_${new Date().toISOString().split('T')[0]}.csv`);
        success(`Exported ${result.data.data.length} reports`);
      }
    } catch (err) {
      showError(err.message || 'Failed to export reports');
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('admin:reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          queryClient.invalidateQueries({ queryKey: adminKeys.reports(filters), exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, filters]);

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await updateReportMutation.mutateAsync({
        reportId,
        data: { status },
      });

      success(status === 'resolved' ? 'Report resolved' : status === 'dismissed' ? 'Report dismissed' : 'Report reopened');
    } catch (err) {
      showError(err.message || 'Failed to update report');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">Report Handling</h2>
        <p className="text-text-secondary">Review community reports and update their status.</p>
      </div>

      <div className="card-static p-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input max-w-[220px]">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <button onClick={handleExportCSV} disabled={isExporting} className="btn-secondary whitespace-nowrap justify-center flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {isLoading && (
        <div className="card-static p-5">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton h-16 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="card-static p-5" role="alert">
          <p className="text-sm text-error">{error?.message || 'Failed to load reports'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {reports?.map((report) => (
            <article key={report.id} className="card-static p-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="badge-secondary uppercase tracking-wide">{report.status}</span>
                    <span className="text-xs text-text-muted">{formatRelativeDate(report.created_at)}</span>
                  </div>

                  <p className="font-semibold text-text">{report.reason}</p>
                  {report.details && <p className="text-sm text-text-secondary mt-1">{report.details}</p>}

                  <p className="text-xs text-text-muted mt-2">
                    Reporter: {report.reporter?.display_name || report.reporter_id}
                  </p>
                  {report.listing && (
                    <p className="text-xs text-text-muted">Listing: {report.listing.title}</p>
                  )}
                  {report.reported_user && (
                    <p className="text-xs text-text-muted">Reported user: {report.reported_user.display_name}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 md:justify-end">
                  {report.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      disabled={updateReportMutation.isPending}
                      className="btn-primary !py-1.5 !px-3 !text-xs"
                    >
                      Resolve
                    </button>
                  )}

                  {report.status !== 'dismissed' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      disabled={updateReportMutation.isPending}
                      className="btn-secondary !py-1.5 !px-3 !text-xs"
                    >
                      Dismiss
                    </button>
                  )}

                  {report.status !== 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'pending')}
                      disabled={updateReportMutation.isPending}
                      className="btn-ghost !py-1.5 !px-3 !text-xs"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}

          {reports?.length === 0 && (
            <div className="card-static p-5 text-center text-text-secondary">No reports found.</div>
          )}
        </div>
      )}

      {pagination && (
        <Pagination pagination={pagination} onPageChange={setPage} />
      )}
    </div>
  );
}
