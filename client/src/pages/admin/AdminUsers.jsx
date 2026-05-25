import useDocumentTitle from '../../hooks/useDocumentTitle';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHardDeleteUser, useUpdateUserBanStatus, useUpdateUserVerifyStatus, useAdminUsers } from '../../hooks/useAdmin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal, { ModalFooter } from '../../components/Modal';
import Pagination from '../../components/ui/Pagination';

export default function AdminUsers() {
  useDocumentTitle('Manage Users');

  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);
  const [page, setPage] = useState(1);

  const banFilter = searchParams.get('banned') || 'all';
  const roleFilter = searchParams.get('role') || 'all';

  const { user, isSuperAdmin } = useAuth();
  const { success, error: showError } = useToast();

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

  const handleToggleBan = async (target) => {
    if (!target.is_banned) {
      if (!window.confirm(`Ban ${target.display_name || 'this user'}? They will lose access to their account.`)) return;
    }
    try {
      await updateBanMutation.mutateAsync({
        userId: target.id,
        data: {
          is_banned: !target.is_banned,
        },
      });

      success(target.is_banned ? 'User unbanned' : 'User banned');
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

  const selectedUser = users?.find((entry) => entry.id === confirmDeleteUserId);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-text">User Management</h2>
        <p className="text-text-secondary">Soft-ban users and manage account access.</p>
      </div>

      <div className="card-static p-4 grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
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
        <div className="card-static overflow-auto">
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
                          className={entry.verified_seller ? 'btn-secondary py-1.5 px-3 text-xs' : 'btn-primary py-1.5 px-3 text-xs'}
                        >
                          {entry.verified_seller ? 'Unverify' : 'Verify'}
                        </button>

                        <button
                          onClick={() => handleToggleBan(entry)}
                          disabled={disableBan || updateBanMutation.isPending}
                          className={entry.is_banned ? 'btn-secondary py-1.5 px-3 text-xs' : 'btn-danger py-1.5 px-3 text-xs'}
                        >
                          {entry.is_banned ? 'Unban' : 'Ban'}
                        </button>

                        {isSuperAdmin && !isSelf && entry.role !== 'super_admin' && (
                          <button
                            onClick={() => setConfirmDeleteUserId(entry.id)}
                            disabled={hardDeleteMutation.isPending}
                            className="btn-danger py-1.5 px-3 text-xs"
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
      )}

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
