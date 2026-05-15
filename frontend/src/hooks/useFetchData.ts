import { useQuery } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

interface UseFetchDataOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
}

export function useFetchData<T>({ queryKey, queryFn, enabled = true }: UseFetchDataOptions<T>) {
  return useQuery<T>({ queryKey, queryFn, staleTime: 1000, enabled });
}
