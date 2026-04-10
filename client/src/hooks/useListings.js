import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { savePendingListing, registerBackgroundSync } from '../lib/offlineStorage';

// Query keys
export const listingKeys = {
  all: ['listings'],
  lists: () => [...listingKeys.all, 'list'],
  list: (filters) => [...listingKeys.lists(), filters],
  details: () => [...listingKeys.all, 'detail'],
  detail: (id) => [...listingKeys.details(), id],
};

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
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: 0,
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
        queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
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
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}
