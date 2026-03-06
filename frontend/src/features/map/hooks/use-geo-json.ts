import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';

interface UseGeoJsonResult {
  data: FeatureCollection | null;
  isLoading: boolean;
  error: string | null;
}

const cache = new Map<string, FeatureCollection>();

export function useGeoJson(url: string): UseGeoJsonResult {
  const [data, setData] = useState<FeatureCollection | null>(cache.get(url) ?? null);
  const [isLoading, setIsLoading] = useState(!cache.has(url));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache.has(url)) {
      setData(cache.get(url)!);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch GeoJSON: ${res.status}`);
        return res.json() as Promise<FeatureCollection>;
      })
      .then((geojson) => {
        cache.set(url, geojson);
        setData(geojson);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load map data');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [url]);

  return { data, isLoading, error };
}
