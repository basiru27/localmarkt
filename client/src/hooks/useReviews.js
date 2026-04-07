import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { listingKeys } from './useListings';

// Query keys
export const reviewKeys = {
  all: ['reviews'],
  lists: () => [...reviewKeys.all, 'list'],
  list: (listingId) => [...reviewKeys.lists(), listingId],
};

// Get all reviews for a listing
export function useReviews(listingId) {
  return useQuery({
    queryKey: reviewKeys.list(listingId),
    queryFn: () => reviewsApi.getByListingId(listingId),
    enabled: !!listingId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Create review mutation
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, data }) => {
      const authHeader = await getAuthHeader();
      return reviewsApi.create(listingId, data, authHeader);
    },
    onSuccess: (_, { listingId }) => {
      // Invalidate reviews list for this listing
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(listingId) });
      // Invalidate listing detail to refresh rating stats
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
      // Invalidate listings list to refresh rating stats in feed
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

// Update review mutation
export function useUpdateReview() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, data }) => {
      const authHeader = await getAuthHeader();
      return reviewsApi.update(reviewId, data, authHeader);
    },
    onSuccess: (_, { listingId }) => {
      // Invalidate reviews list for this listing
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(listingId) });
      // Invalidate listing detail to refresh rating stats
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
      // Invalidate listings list to refresh rating stats in feed
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}

// Delete review mutation
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId }) => {
      const authHeader = await getAuthHeader();
      return reviewsApi.delete(reviewId, authHeader);
    },
    onSuccess: (_, { listingId }) => {
      // Invalidate reviews list for this listing
      queryClient.invalidateQueries({ queryKey: reviewKeys.list(listingId) });
      // Invalidate listing detail to refresh rating stats
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(listingId) });
      // Invalidate listings list to refresh rating stats in feed
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
    },
  });
}
