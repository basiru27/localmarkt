import { useMemo, useState } from 'react';
import { useAdminReports, useUpdateReportStatus } from '../../hooks/useAdmin';
import { useToast } from '../../context/ToastContext';
import { formatRelativeDate } from '../../lib/utils';

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const { success, error: showError } = useToast();

  const filters = useMemo(() => {
    const next = {};
    if (statusFilter !== 'all') next.status = statusFilter;
    return next;
  }, [statusFilter]);

  const { data: reports, isLoading, isError, error } = useAdminReports(filters);
  const updateReportMutation = useUpdateReportStatus();

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

      <div className="card-static p-4">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input max-w-[220px]">
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
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
                      className="btn-primary py-1.5 px-3 text-xs"
                    >
                      Resolve
                    </button>
                  )}

                  {report.status !== 'dismissed' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      disabled={updateReportMutation.isPending}
                      className="btn-secondary py-1.5 px-3 text-xs"
                    >
                      Dismiss
                    </button>
                  )}

                  {report.status !== 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'pending')}
                      disabled={updateReportMutation.isPending}
                      className="btn-ghost py-1.5 px-3 text-xs"
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
    </div>
  );
}
