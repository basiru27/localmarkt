import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { listingKeys } from './useListings';

export const adminKeys = {
  all: ['admin'],
  stats: () => [...adminKeys.all, 'stats'],
  users: (filters) => [...adminKeys.all, 'users', filters],
  listings: (filters) => [...adminKeys.all, 'listings', filters],
  reports: (filters) => [...adminKeys.all, 'reports', filters],
  logs: () => [...adminKeys.all, 'logs'],
  disputes: () => [...adminKeys.all, 'disputes'],
};

function useAdminHeader() {
  const { getAuthHeader } = useAuth();
  return getAuthHeader;
}

export function useAdminStats() {
  const getAuthHeader = useAdminHeader();

  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return adminApi.getStats(authHeader);
    },
    refetchInterval: 30000,
  });
}

export function useAdminUsers(filters = {}) {
  const getAuthHeader = useAdminHeader();

  return useQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return adminApi.getUsers(filters, authHeader);
    },
  });
}

export function useAdminListings(filters = {}) {
  const getAuthHeader = useAdminHeader();

  return useQuery({
    queryKey: adminKeys.listings(filters),
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return adminApi.getListings(filters, authHeader);
    },
  });
}

export function useAdminReports(filters = {}) {
  const getAuthHeader = useAdminHeader();

  return useQuery({
    queryKey: adminKeys.reports(filters),
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return adminApi.getReports(filters, authHeader);
    },
  });
}

export function useAdminLogs(enabled = true) {
  const getAuthHeader = useAdminHeader();

  return useQuery({
    queryKey: adminKeys.logs(),
    enabled,
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return adminApi.getLogs(authHeader);
    },
  });
}

export function useUpdateUserBanStatus() {
  const queryClient = useQueryClient();
  const getAuthHeader = useAdminHeader();

  return useMutation({
    mutationFn: async ({ userId, data }) => {
      const authHeader = await getAuthHeader();
      return adminApi.updateBanStatus(userId, data, authHeader);
    },
    onMutate: async ({ userId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });
      
      const previousQueries = queryClient.getQueriesData({ queryKey: ['admin', 'users'] });
      
      queryClient.setQueriesData({ queryKey: ['admin', 'users'] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((user) => (user.id === userId ? { ...user, is_banned: data.is_banned } : user));
      });
      
      return { previousQueries };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
           queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useUpdateUserVerifyStatus() {
  const queryClient = useQueryClient();
  const getAuthHeader = useAdminHeader();

  return useMutation({
    mutationFn: async ({ userId, data }) => {
      const authHeader = await getAuthHeader();
      return adminApi.updateVerifyStatus(userId, data, authHeader);
    },
    onMutate: async ({ userId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'users'] });
      
      const previousQueries = queryClient.getQueriesData({ queryKey: ['admin', 'users'] });
      
      queryClient.setQueriesData({ queryKey: ['admin', 'users'] }, (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((user) => (user.id === userId ? { ...user, verified_seller: data.verified_seller } : user));
      });
      
      return { previousQueries };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
           queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useHardDeleteUser() {
  const queryClient = useQueryClient();
  const getAuthHeader = useAdminHeader();

  return useMutation({
    mutationFn: async (userId) => {
      const authHeader = await getAuthHeader();
      return adminApi.hardDeleteUser(userId, authHeader);
    },
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
      
        queryClient.invalidateQueries({ queryKey: listingKeys.all })
      ]);
    },
  });
}

export function useModerateListing() {
  const queryClient = useQueryClient();
  const getAuthHeader = useAdminHeader();

  return useMutation({
    mutationFn: async ({ listingId, data }) => {
      const authHeader = await getAuthHeader();
      return adminApi.moderateListing(listingId, data, authHeader);
    },
    onMutate: async ({ listingId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'listings'] });
      
      const previousQueries = queryClient.getQueriesData({ queryKey: ['admin', 'listings'] });
      
      queryClient.setQueriesData({ queryKey: ['admin', 'listings'] }, (oldData) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
           return oldData.map(l => l.id === listingId ? { ...l, moderation_status: data.moderation_status } : l);
        }
        return oldData;
      });

      return { previousQueries };
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
           queryClient.setQueryData(queryKey, previousData);
        });
      }
    },
    onSettled: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: listingKeys.all })
      ]);
    },
  });
}

export function useAdminDeleteListing() {
  const queryClient = useQueryClient();
  const getAuthHeader = useAdminHeader();

  return useMutation({
    mutationFn: async (listingId) => {
      const authHeader = await getAuthHeader();
      return adminApi.deleteListing(listingId, authHeader);
    },
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
      
        queryClient.invalidateQueries({ queryKey: listingKeys.all })
      ]);
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  const getAuthHeader = useAdminHeader();

  return useMutation({
    mutationFn: async ({ reportId, data }) => {
      const authHeader = await getAuthHeader();
      return adminApi.updateReport(reportId, data, authHeader);
    },
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
      
        queryClient.invalidateQueries({ queryKey: listingKeys.all })
      ]);
    },
  });
}
