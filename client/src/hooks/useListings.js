import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { listingsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { savePendingListing, registerBackgroundSync } from '../lib/offlineStorage';

// Query keys
export const listingKeys = {
  all: ['listings'],
  stats: () => [...listingKeys.all, 'stats'],
  lists: () => [...listingKeys.all, 'list'],
  list: (filters) => [...listingKeys.lists(), filters],
  details: () => [...listingKeys.all, 'detail'],
  detail: (id) => [...listingKeys.details(), id],
};

export function useListingStats() {
  return useQuery({
    queryKey: listingKeys.stats(),
    queryFn: async () => {
      // Direct fetch to our new endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/listings/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 mins
  });
}

// Get all listings with optional filters
export function useListings(filters = {}) {
  const { isAuthenticated, getAuthHeader } = useAuth();

  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: async () => {
      if (filters.mine) {
        if (!isAuthenticated) {
          return {
            data: [],
            pagination: {
              page: 1,
              totalPages: 0,
              total: 0,
              limit: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          };
        }

        const authHeader = await getAuthHeader();
        return listingsApi.getMine(filters, authHeader);
      }

      return listingsApi.getAll(filters);
    },
    staleTime: filters.mine ? 0 : 1000 * 60 * 5, // 0 for realtime backed, 5 min for public feed
    placeholderData: keepPreviousData,
  });
}

// Get single listing by ID
export function useListing(id) {
  const { isAuthenticated, getAuthHeader } = useAuth();

  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: async () => {
      if (!isAuthenticated) {
        return listingsApi.getById(id);
      }

      const authHeader = await getAuthHeader();
      return listingsApi.getById(id, authHeader);
    },
    enabled: !!id,
    staleTime: 0, // Realtime backed
  });
}

// Create listing mutation
export function useCreateListing() {
  const queryClient = useQueryClient();
  const { getAuthHeader, user } = useAuth();
  const { isOnline, refreshPendingCount } = useOffline();

  return useMutation({
    mutationFn: async (data) => {
      // If offline, save to IndexedDB
      if (!isOnline) {
        const pendingId = await savePendingListing({
          ...data,
          user_id: user.id,
        });
        await registerBackgroundSync();
        await refreshPendingCount();
        return { pending: true, pendingId };
      }

      // If online, post to API (getAuthHeader is async to ensure fresh token)
      const authHeader = await getAuthHeader();
      return listingsApi.create(data, authHeader);
    },
    onSuccess: (data) => {
      if (!data.pending) {
        queryClient.setQueriesData({ queryKey: listingKeys.lists() }, (oldData) => {
          if (!oldData || !oldData.data) return oldData;
          return {
            ...oldData,
            data: [data, ...oldData.data],
            pagination: oldData.pagination ? {
              ...oldData.pagination,
              total: oldData.pagination.total + 1,
            } : undefined,
          };
        });
        return queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      }
    },
  });
}

// Update listing mutation
export function useUpdateListing() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const authHeader = await getAuthHeader();
      return listingsApi.update(id, data, authHeader);
    },
    onSuccess: (updatedData, { id }) => {
      queryClient.setQueriesData({ queryKey: listingKeys.detail(id) }, updatedData);
      queryClient.setQueriesData({ queryKey: listingKeys.lists() }, (oldData) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item) => (item.id === id ? { ...item, ...updatedData } : item)),
        };
      });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: listingKeys.lists() }),
      ]);
    },
  });
}

// Delete listing mutation
export function useDeleteListing() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();
  
  return useMutation({
    mutationFn: async (id) => {
      const authHeader = await getAuthHeader();
      return listingsApi.delete(id, authHeader);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useMarkAsSold() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async ({ id, is_sold }) => {
      const authHeader = await getAuthHeader();
      return listingsApi.markAsSold(id, is_sold, authHeader);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

export function useAnalytics(range = '7') {
  const { user, getAuthHeader, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['analytics', range],
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      return listingsApi.getMineAnalytics(range, authHeader);
    },
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useBumpListing() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async (id) => {
      const authHeader = await getAuthHeader();
      return listingsApi.bump(id, authHeader);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
    },
  });
}
