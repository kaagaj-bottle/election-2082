import { useCallback, useEffect, useRef, useState } from 'react';

interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[]): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchId = useRef(0);

  const doFetch = useCallback(() => {
    const id = ++fetchId.current;
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetcher(controller.signal)
      .then((result) => {
        if (id === fetchId.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (id === fetchId.current && !(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setIsLoading(false);
        }
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    return doFetch();
  }, [doFetch]);

  return { data, isLoading, error, refetch: doFetch };
}
