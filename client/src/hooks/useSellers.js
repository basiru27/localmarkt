import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';

export const sellerKeys = {
  profile: (id) => ['seller', id, 'profile'],
  listings: (id, page) => ['seller', id, 'listings', page],
  reviews: (id, page) => ['seller', id, 'reviews', page],
};

export function useSellerProfile(sellerId) {
  return useQuery({
    queryKey: sellerKeys.profile(sellerId),
    queryFn: () => fetchApi(`/sellers/${sellerId}`).then(r => r.seller),
    enabled: !!sellerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSellerListings(sellerId, page = 1) {
  return useQuery({
    queryKey: sellerKeys.listings(sellerId, page),
    queryFn: () =>
      fetchApi(`/sellers/${sellerId}/listings?page=${page}&limit=12`).then(r => r),
    enabled: !!sellerId,
    placeholderData: (prev) => prev,
  });
}

export function useSellerReviews(sellerId, page = 1) {
  return useQuery({
    queryKey: sellerKeys.reviews(sellerId, page),
    queryFn: () =>
      fetchApi(`/sellers/${sellerId}/reviews?page=${page}&limit=10`).then(r => r),
    enabled: !!sellerId,
    placeholderData: (prev) => prev,
  });
}
