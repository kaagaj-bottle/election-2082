import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { CursorPage } from '@/types/api';

interface State<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  nextUrl: string | null;
  previousUrl: string | null;
}

type Action<T> =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: CursorPage<T> }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'RESET' };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        items: action.payload.results,
        isLoading: false,
        error: null,
        nextUrl: action.payload.next,
        previousUrl: action.payload.previous,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'RESET':
      return { items: [], isLoading: true, error: null, nextUrl: null, previousUrl: null };
  }
}

function initialState<T>(): State<T> {
  return { items: [], isLoading: true, error: null, nextUrl: null, previousUrl: null };
}

export function useCursorPagination<T>(
  fetchPage: (params: Record<string, string | undefined>, signal: AbortSignal) => Promise<CursorPage<T>>,
  fetchByUrl: (url: string, signal: AbortSignal) => Promise<CursorPage<T>>,
  params: Record<string, string | undefined>,
) {
  const [state, dispatch] = useReducer(reducer<T>, undefined, initialState<T>);
  const fetchId = useRef(0);
  const paramsKey = JSON.stringify(params);

  const doFetch = useCallback(
    (fetcher: (signal: AbortSignal) => Promise<CursorPage<T>>) => {
      const id = ++fetchId.current;
      const controller = new AbortController();

      dispatch({ type: 'FETCH_START' });

      fetcher(controller.signal)
        .then((page) => {
          if (id === fetchId.current) {
            dispatch({ type: 'FETCH_SUCCESS', payload: page });
          }
        })
        .catch((err: unknown) => {
          if (id === fetchId.current && !(err instanceof DOMException && err.name === 'AbortError')) {
            dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err.message : 'An error occurred' });
          }
        });

      return () => controller.abort();
    },
    [],
  );

  // Reset to first page when params change
  useEffect(() => {
    dispatch({ type: 'RESET' });
    return doFetch((signal) => fetchPage(params, signal));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, doFetch]);

  const goNext = useCallback(() => {
    if (state.nextUrl) {
      doFetch((signal) => fetchByUrl(state.nextUrl!, signal));
    }
  }, [state.nextUrl, doFetch, fetchByUrl]);

  const goPrevious = useCallback(() => {
    if (state.previousUrl) {
      doFetch((signal) => fetchByUrl(state.previousUrl!, signal));
    }
  }, [state.previousUrl, doFetch, fetchByUrl]);

  return {
    items: state.items,
    isLoading: state.isLoading,
    error: state.error,
    hasNext: state.nextUrl !== null,
    hasPrevious: state.previousUrl !== null,
    goNext,
    goPrevious,
  };
}
