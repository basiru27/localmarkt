import { useQuery } from '@tanstack/react-query';
import { zonesApi, categoriesApi } from '../lib/api';

// Query keys
export const lookupKeys = {
  zones: ['zones'],
  areas: (zoneId) => ['areas', zoneId],
  categories: ['categories'],
};

// Get all zones
export function useZones() {
  return useQuery({
    queryKey: lookupKeys.zones,
    queryFn: zonesApi.getAll,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Get areas for a specific zone
export function useAreas(zoneId) {
  return useQuery({
    queryKey: lookupKeys.areas(zoneId),
    queryFn: () => zonesApi.getAreas(zoneId),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

// Get all categories
export function useCategories() {
  return useQuery({
    queryKey: lookupKeys.categories,
    queryFn: categoriesApi.getAll,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
