import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHardDeleteUser, useUpdateUserBanStatus, useUpdateUserVerifyStatus, useAdminUsers, useExportUsers } from '../../hooks/useAdmin';
import { exportToCSV } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal, { ModalFooter } from '../../components/Modal';
import Pagination from '../../components/ui/Pagination';

export default function AdminUsers() {
  useDocumentTitle('Manage Users');

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);
  const [confirmBanAction, setConfirmBanAction] = useState(null);
  const [confirmUnbanAction, setConfirmUnbanAction] = useState(null);
  const [page, setPage] = useState(1);

  const banFilter = searchParams.get('banned') || 'all';
  const roleFilter = searchParams.get('role') || 'all';

  const { user, isSuperAdmin } = useAuth();
  const { success, error: showError } = useToast();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, banFilter, roleFilter]);

  const filters = useMemo(() => {
    const next = { page, limit: 20 };
    if (search.trim()) next.search = search.trim();
    if (banFilter !== 'all') next.banned = banFilter;
    if (roleFilter !== 'all') next.role = roleFilter;
    return next;
  }, [search, banFilter, roleFilter, page]);

  const { data, isLoading, isError, error } = useAdminUsers(filters);
  const users = data?.data || [];
  const pagination = data?.pagination;
  const updateBanMutation = useUpdateUserBanStatus();
  const updateVerifyMutation = useUpdateUserVerifyStatus();
  const hardDeleteMutation = useHardDeleteUser();
  const { refetch: exportUsers, isRefetching: isExporting } = useExportUsers();

  const handleToggleBan = (target) => {
    if (!target.is_banned) {
      setConfirmBanAction({ userId: target.id, is_banned: true });
      return;
    }
    setConfirmUnbanAction({ userId: target.id, display_name: target.display_name, is_banned: false });
  };

  const handleConfirmBan = async () => {
    if (!confirmBanAction) return;
    try {
      await updateBanMutation.mutateAsync({
        userId: confirmBanAction.userId,
        data: {
          is_banned: confirmBanAction.is_banned,
        },
      });
      success('User banned');
      setConfirmBanAction(null);
    } catch (err) {
      showError(err.message || 'Failed to update user ban status');
    }
  };

  const handleConfirmUnban = async () => {
    if (!confirmUnbanAction) return;
    try {
      await updateBanMutation.mutateAsync({
        userId: confirmUnbanAction.userId,
        data: {
          is_banned: false,
        },
      });
      success('User unbanned');
      setConfirmUnbanAction(null);
    } catch (err) {
      showError(err.message || 'Failed to update user ban status');
    }
  };

  const handleToggleVerify = async (target) => {
    try {
      await updateVerifyMutation.mutateAsync({
        userId: target.id,
        data: {
          verified_seller: !target.verified_seller,
        },
      });

      success(target.verified_seller ? 'Seller verification removed' : 'Seller verified');
    } catch (err) {
      showError(err.message || 'Failed to update user verification status');
    }
  };

  const handleHardDelete = async () => {
    if (!confirmDeleteUserId) return;

    try {
      await hardDeleteMutation.mutateAsync(confirmDeleteUserId);
      success('User permanently deleted');
      setConfirmDeleteUserId(null);
    } catch (err) {
      showError(err.message || 'Failed to permanently delete user');
    }
  };

  const handleExportCSV = async () => {
    try {
      const result = await exportUsers();
      if (result.data?.data) {
        exportToCSV(result.data.data, [
          { key: 'id', label: 'ID' },
          { key: 'display_name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'is_banned', label: 'Banned' },
          { key: 'verified_seller', label: 'Verified Seller' },
          { key: 'listing_count', label: 'Listings' },
          { key: 'created_at', label: 'Joined' },
        ], `users_${new Date().toISOString().split('T')[0]}.csv`);
        success(`Exported ${result.data.data.length} users`);
      }
    } catch (err) {
      showError(err.message || 'Failed to export users');
    }
  };

  const selectedUser = users?.find((entry) => entry.id === confirmDeleteUserId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">User Management</h2>
        <p className="text-text-secondary">Soft-ban users and manage account access.</p>
      </div>

      <div className="card-static p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input"
          placeholder="Search by display name"
        />

        <select value={banFilter} onChange={(event) => {
          const value = event.target.value;
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === 'all') next.delete('banned');
            else next.set('banned', value);
            return next;
          });
        }} className="input">
          <option value="all">All statuses</option>
          <option value="true">Banned</option>
          <option value="false">Active</option>
        </select>

        <select value={roleFilter} onChange={(event) => {
          const value = event.target.value;
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (value === 'all') next.delete('role');
            else next.set('role', value);
            return next;
          });
        }} className="input">
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <button onClick={handleExportCSV} disabled={isExporting} className="btn-secondary whitespace-nowrap justify-center flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {isLoading && (
        <div className="card-static p-5">
          <div className="skeleton h-5 w-48 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-10 w-full" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="card-static p-5" role="alert">
          <p className="text-sm text-error">{error?.message || 'Failed to load users'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
        {/* Mobile card view */}
        <div className="space-y-3 lg:hidden">
          {users?.map((entry) => {
            const isSelf = entry.id === user?.id;
            const isSuperAdminTarget = entry.role === 'super_admin';
            const disableBan = isSelf || (isSuperAdminTarget && !isSuperAdmin);

            return (
              <div key={entry.id} className="card-static p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#C8622A] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(entry.display_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text truncate">{entry.display_name || 'User'}</p>
                    <p className="text-xs text-text-secondary truncate">{entry.email || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="badge-secondary uppercase tracking-wide text-xs">{entry.role}</span>
                  {entry.verified_seller && (
                    <span className="inline-flex items-center text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs font-medium">
                      Verified
                    </span>
                  )}
                  {entry.is_banned ? (
                    <span className="badge-error text-xs">Banned</span>
                  ) : (
                    <span className="badge-success text-xs">Active</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary mb-3">
                  <span>Joined {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span>{entry.listing_count} listings</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleToggleVerify(entry)}
                    disabled={updateVerifyMutation.isPending}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      entry.verified_seller
                        ? 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        : 'bg-[#C8622A] text-white hover:bg-[#B0521A]'
                    }`}
                  >
                    {entry.verified_seller ? 'Unverify' : 'Verify'}
                  </button>
                  <button
                    onClick={() => handleToggleBan(entry)}
                    disabled={disableBan || updateBanMutation.isPending}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      entry.is_banned
                        ? 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {entry.is_banned ? 'Unban' : 'Ban'}
                  </button>
                  {isSuperAdmin && !isSelf && entry.role !== 'super_admin' && (
                    <button
                      onClick={() => setConfirmDeleteUserId(entry.id)}
                      disabled={hardDeleteMutation.isPending}
                      className="flex-1 py-2 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {users?.length === 0 && (
            <div className="card-static p-5 text-center text-text-secondary">No users found.</div>
          )}
          {pagination && (
            <div className="px-1 pb-1">
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="card-static overflow-auto hidden lg:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-border-light">
              <tr>
                <th className="text-left p-3 font-semibold text-text">Name</th>
                <th className="text-left p-3 font-semibold text-text">Email</th>
                <th className="text-left p-3 font-semibold text-text">Role</th>
                <th className="text-left p-3 font-semibold text-text">Joined</th>
                <th className="text-left p-3 font-semibold text-text">Listings</th>
                <th className="text-left p-3 font-semibold text-text">Status</th>
                <th className="text-right p-3 font-semibold text-text">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((entry) => {
                const isSelf = entry.id === user?.id;
                const isSuperAdminTarget = entry.role === 'super_admin';
                const disableBan = isSelf || (isSuperAdminTarget && !isSuperAdmin);

                return (
                  <tr key={entry.id} className="border-b border-border-light last:border-b-0">
                    <td className="p-3 font-medium text-text">
                      <div className="flex items-center gap-2">
                        {entry.display_name || 'User'}
                        {entry.verified_seller && (
                          <span className="inline-flex items-center text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs font-medium" title="Verified Seller">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-text-secondary">{entry.email || 'Unknown'}</td>
                    <td className="p-3">
                      <span className="badge-secondary uppercase tracking-wide">{entry.role}</span>
                    </td>
                    <td className="p-3 text-text-secondary">
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 text-text-secondary">{entry.listing_count}</td>
                    <td className="p-3">
                      {entry.is_banned ? (
                        <span className="badge-error">Banned</span>
                      ) : (
                        <span className="badge-success">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end items-center">
                        <button
                          onClick={() => handleToggleVerify(entry)}
                          disabled={updateVerifyMutation.isPending}
                          className={entry.verified_seller ? 'btn-secondary !py-1.5 !px-3 !text-xs' : 'btn-primary !py-1.5 !px-3 !text-xs'}
                        >
                          {entry.verified_seller ? 'Unverify' : 'Verify'}
                        </button>

                        <button
                          onClick={() => handleToggleBan(entry)}
                          disabled={disableBan || updateBanMutation.isPending}
                          className={entry.is_banned ? 'btn-secondary !py-1.5 !px-3 !text-xs' : 'btn-danger !py-1.5 !px-3 !text-xs'}
                        >
                          {entry.is_banned ? 'Unban' : 'Ban'}
                        </button>

                        {isSuperAdmin && !isSelf && entry.role !== 'super_admin' && (
                          <button
                            onClick={() => setConfirmDeleteUserId(entry.id)}
                            disabled={hardDeleteMutation.isPending}
                            className="btn-danger !py-1.5 !px-3 !text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-text-secondary">
                    No users found.
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
        </>
      )}

      <Modal
        isOpen={!!confirmBanAction}
        onClose={() => setConfirmBanAction(null)}
        title="Ban User"
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to ban this user? They will lose access to their account immediately.
        </p>
        <ModalFooter>
          <button onClick={() => setConfirmBanAction(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirmBan} disabled={updateBanMutation.isPending} className="btn-danger">
            {updateBanMutation.isPending ? 'Banning...' : 'Ban User'}
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={!!confirmUnbanAction}
        onClose={() => setConfirmUnbanAction(null)}
        title="Unban User"
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          Are you sure you want to unban <span className="font-semibold text-text">{confirmUnbanAction?.display_name || 'this user'}</span>? They will regain full access to the marketplace.
        </p>
        <ModalFooter>
          <button onClick={() => setConfirmUnbanAction(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirmUnban} disabled={updateBanMutation.isPending} className="btn-primary" style={{ backgroundColor: '#C2622A' }}>
            {updateBanMutation.isPending ? 'Unbanning...' : 'Confirm Unban'}
          </button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={!!confirmDeleteUserId}
        onClose={() => setConfirmDeleteUserId(null)}
        title="Permanently Delete User"
        size="sm"
      >
        <p className="text-sm text-text-secondary">
          This will permanently remove <span className="font-semibold text-text">{selectedUser?.display_name || 'this user'}</span> and all linked data. This action cannot be undone.
        </p>
        <ModalFooter>
          <button onClick={() => setConfirmDeleteUserId(null)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleHardDelete} disabled={hardDeleteMutation.isPending} className="btn-danger">
            Permanently Delete
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
