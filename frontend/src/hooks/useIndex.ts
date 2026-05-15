import { useQuery } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

interface UseIndexOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  params?: Record<string, unknown>;
}

export function useIndex<T>({ queryKey, queryFn, params = {} }: UseIndexOptions<T>) {
  return useQuery<T>({
    queryKey: [...(queryKey as unknown[]), params],
    queryFn,
    staleTime: 1000,
  });
}
