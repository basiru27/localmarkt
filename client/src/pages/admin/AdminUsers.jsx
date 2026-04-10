import { useMemo, useState } from 'react';
import { useHardDeleteUser, useUpdateUserBanStatus, useAdminUsers } from '../../hooks/useAdmin';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal, { ModalFooter } from '../../components/Modal';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [banFilter, setBanFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);

  const { user, isSuperAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const filters = useMemo(() => {
    const next = {};
    if (search.trim()) next.search = search.trim();
    if (banFilter !== 'all') next.banned = banFilter;
    if (roleFilter !== 'all') next.role = roleFilter;
    return next;
  }, [search, banFilter, roleFilter]);

  const { data: users, isLoading, isError, error } = useAdminUsers(filters);
  const updateBanMutation = useUpdateUserBanStatus();
  const hardDeleteMutation = useHardDeleteUser();

  const handleToggleBan = async (target) => {
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

        <select value={banFilter} onChange={(event) => setBanFilter(event.target.value)} className="input">
          <option value="all">All statuses</option>
          <option value="true">Banned</option>
          <option value="false">Active</option>
        </select>

        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="input">
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
                    <td className="p-3 font-medium text-text">{entry.display_name || 'User'}</td>
                    <td className="p-3 text-text-secondary">{entry.email || 'Unknown'}</td>
                    <td className="p-3">
                      <span className="badge-secondary uppercase tracking-wide">{entry.role}</span>
                    </td>
                    <td className="p-3">
                      {entry.is_banned ? (
                        <span className="badge-error">Banned</span>
                      ) : (
                        <span className="badge-success">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
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
