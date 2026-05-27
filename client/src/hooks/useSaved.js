import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const savedKeys = {
  all: ['saved'],
  ids: () => ['saved', 'ids'],
};

export function useSavedListings() {
  const { user, getAuthHeader } = useAuth();

  return useQuery({
    queryKey: savedKeys.all,
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      const res = await savedApi.getAll(authHeader);
      return res.saved;
    },
    enabled: !!user,
    retry: 1,
  });
}

export function useSavedIds() {
  const { user, getAuthHeader } = useAuth();

  return useQuery({
    queryKey: savedKeys.ids(),
    queryFn: async () => {
      const authHeader = await getAuthHeader();
      const res = await savedApi.getIds(authHeader);
      return res.ids;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, isSaved }) => {
      const authHeader = await getAuthHeader();
      return isSaved
        ? savedApi.unsave(listingId, authHeader)
        : savedApi.save(listingId, authHeader);
    },
    onMutate: async ({ listingId, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: savedKeys.ids() });
      const prev = queryClient.getQueryData(savedKeys.ids());
      queryClient.setQueryData(savedKeys.ids(), (old = []) =>
        isSaved ? old.filter(id => id !== listingId) : [...old, listingId]
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(savedKeys.ids(), ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: savedKeys.all });
      queryClient.invalidateQueries({ queryKey: savedKeys.ids() });
    },
  });
}
