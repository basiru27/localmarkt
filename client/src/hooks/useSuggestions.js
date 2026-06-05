import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../lib/api';

export function useSuggestions(query) {
  return useQuery({
    queryKey: ['suggestions', query],
    queryFn: () => listingsApi.getSuggestions(query),
    enabled: query?.length >= 2,
    staleTime: 1000 * 60, // 1 minute cache
    retry: false,
  });
}
