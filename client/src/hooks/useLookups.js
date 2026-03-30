import { useQuery } from '@tanstack/react-query';
import { regionsApi, categoriesApi } from '../lib/api';

// Query keys
export const lookupKeys = {
  regions: ['regions'],
  categories: ['categories'],
};

// Get all regions
export function useRegions() {
  return useQuery({
    queryKey: lookupKeys.regions,
    queryFn: regionsApi.getAll,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - rarely changes
  });
}

// Get all categories
export function useCategories() {
  return useQuery({
    queryKey: lookupKeys.categories,
    queryFn: categoriesApi.getAll,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - rarely changes
  });
}
