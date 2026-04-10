import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { listingKeys } from './useListings';

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async (data) => {
      const authHeader = await getAuthHeader();
      return reportsApi.create(data, authHeader);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}
