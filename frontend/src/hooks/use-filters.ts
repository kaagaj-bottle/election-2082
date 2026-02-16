import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CandidateFilterParams } from '@/types/filters';

const FILTER_KEYS: (keyof CandidateFilterParams)[] = [
  'search',
  'election',
  'election_type',
  'party',
  'constituency',
  'district',
  'province',
  'gender',
  'age_min',
  'age_max',
  'ordering',
];

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result: Record<string, string | undefined> = {};
    for (const key of FILTER_KEYS) {
      const value = searchParams.get(key);
      if (value) result[key] = value;
    }
    return result;
  }, [searchParams]);

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, setFilter, clearFilters };
}
