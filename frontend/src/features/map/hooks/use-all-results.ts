import { useEffect, useState } from 'react';
import { getProvinceResults } from '@/services/results';
import type { ProvinceConstituencyResult } from '@/types/api';

interface UseAllResultsReturn {
  results: ProvinceConstituencyResult[];
  resultsByDistrict: Map<string, ProvinceConstituencyResult[]>;
  resultsByConstituencyId: Map<number, ProvinceConstituencyResult>;
  resultsByConstituencyKey: Map<string, ProvinceConstituencyResult>;
  isLoading: boolean;
  error: string | null;
}

export function useAllResults(): UseAllResultsReturn {
  const [results, setResults] = useState<ProvinceConstituencyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all(
      [1, 2, 3, 4, 5, 6, 7].map((id) => getProvinceResults(id, controller.signal)),
    )
      .then((allProvince) => {
        setResults(allProvince.flat());
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load results');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Build lookup maps
  const resultsByDistrict = new Map<string, ProvinceConstituencyResult[]>();
  const resultsByConstituencyId = new Map<number, ProvinceConstituencyResult>();
  const resultsByConstituencyKey = new Map<string, ProvinceConstituencyResult>();

  for (const r of results) {
    const distName = r.constituency.district.name.toLowerCase().trim();
    const existing = resultsByDistrict.get(distName) ?? [];
    existing.push(r);
    resultsByDistrict.set(distName, existing);
    resultsByConstituencyId.set(r.constituency.id, r);
    // Key: "{district_name_lower}-{constituency_number}"
    const key = `${distName}-${r.constituency.number}`;
    resultsByConstituencyKey.set(key, r);
  }

  return { results, resultsByDistrict, resultsByConstituencyId, resultsByConstituencyKey, isLoading, error };
}
