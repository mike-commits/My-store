/**
 * src/core/hooks/useSupabaseQuery.ts
 * ─────────────────────────────────────────────────────────────
 * Generic data-fetching hook for Supabase queries.
 * Accepts an async queryFn that returns T, a dependency array,
 * and returns { data, loading, error, refetch }.
 * The queryFn is re-executed whenever deps change.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef, DependencyList } from 'react';

interface UseSupabaseQueryResult<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  deps: DependencyList = []
): UseSupabaseQueryResult<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error,   setError]   = useState<string | null>(null);

  // Stable reference to queryFn so we can call it from refetch
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFnRef.current();
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setError(msg);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
