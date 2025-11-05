import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom hook for Supabase queries with React Query
 *
 * Provides type-safe queries with automatic caching and revalidation
 *
 * @param key - Query key for caching
 * @param fetcher - Async function that returns data
 * @returns React Query result
 */
export function useSupabaseQuery<T>(
  key: string[],
  fetcher: () => Promise<{ data: T | null; error: PostgrestError | null }>
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const result = await fetcher();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });
}

/**
 * Custom hook for Supabase mutations with React Query
 *
 * Provides type-safe mutations with automatic cache invalidation
 *
 * @param mutationFn - Async function that performs the mutation
 * @param onSuccess - Optional callback on success
 * @returns React Query mutation result
 */
export function useSupabaseMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<{ data: TData | null; error: PostgrestError | null }>,
  onSuccess?: (data: TData | null) => void | Promise<void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const result = await mutationFn(variables);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries();
      if (onSuccess) {
        await onSuccess(data);
      }
    },
  });
}

/**
 * Hook to access Supabase client in components
 *
 * @returns Supabase client instance
 */
export function useSupabase() {
  return createClient();
}
