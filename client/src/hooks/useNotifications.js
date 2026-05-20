import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const notificationKeys = {
  all: ['notifications'],
};

export function useNotifications() {
  const { user, getAuthHeader } = useAuth();

  const query = useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return notificationsApi.getAll({}, authHeader);
    },
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  return {
    notifications: query.data?.notifications || [],
    unreadCount: query.data?.unread_count || 0,
    isLoading: query.isLoading,
  };
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async (id) => {
      const authHeader = await getAuthHeader();
      return notificationsApi.markRead(id, authHeader);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const authHeader = await getAuthHeader();
      return notificationsApi.markAllRead(authHeader);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async (id) => {
      const authHeader = await getAuthHeader();
      return notificationsApi.delete(id, authHeader);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}