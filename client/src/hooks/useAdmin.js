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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
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
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
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
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
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
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
