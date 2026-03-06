import { useState, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { useLang } from '@/contexts/language-context';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGeoJson } from './hooks/use-geo-json';
import { useAllResults } from './hooks/use-all-results';
import { NepalMap } from './components/NepalMap';
import { SelectedConstituencyResults } from './components/SelectedConstituencyResults';
import type { ProvinceConstituencyResult } from '@/types/api';

const DISTRICTS_URL =
  'https://raw.githubusercontent.com/mesaugat/geoJSON-Nepal/master/nepal-districts-new.geojson';
const CONSTITUENCIES_URL = '/geojson/nepal-constituencies.geojson';

function useIsDark() {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark');
  }
  return false;
}

export default function MapPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const isDark = useIsDark();

  const districts = useGeoJson(DISTRICTS_URL);
  const constituencies = useGeoJson(CONSTITUENCIES_URL);
  const {
    resultsByConstituencyKey,
    isLoading: resultsLoading,
    error: resultsError,
  } = useAllResults();

  const [selectedConstituencyKey, setSelectedConstituencyKey] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ProvinceConstituencyResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSelectConstituency = useCallback(
    (key: string, result: ProvinceConstituencyResult | null) => {
      setSelectedConstituencyKey(key);
      setSelectedResult(result);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    },
    [],
  );

  const handleCloseResults = useCallback(() => {
    setSelectedConstituencyKey(null);
    setSelectedResult(null);
  }, []);

  const isLoadingGeo = districts.isLoading || constituencies.isLoading;
  const geoError = districts.error || constituencies.error;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold text-ink-800 dark:text-ink-100">
        {isNe ? 'नक्सा' : 'Election Map'}
      </h1>
      <p className="mb-4 text-sm text-ink-500 dark:text-ink-400">
        {isNe
          ? 'क्षेत्रमा क्लिक गरेर विस्तृत नतिजा हेर्नुहोस्'
          : 'Click on a constituency to view detailed results'}
      </p>

      {/* Loading state */}
      {(isLoadingGeo || resultsLoading) && (
        <div className="space-y-3">
          <Skeleton className="h-[400px] w-full rounded-lg sm:h-[500px] lg:h-[600px]" />
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Spinner size="sm" />
            {isNe ? 'नक्सा लोड हुँदैछ...' : 'Loading map data...'}
          </div>
        </div>
      )}

      {/* Error state */}
      {(geoError || resultsError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {geoError || resultsError}
        </div>
      )}

      {/* Map */}
      {!isLoadingGeo && !resultsLoading && !geoError && (
        <NepalMap
          districts={districts.data}
          constituencies={constituencies.data}
          resultsByConstituencyKey={resultsByConstituencyKey}
          isDark={isDark}
          isNe={isNe}
          onSelectConstituency={handleSelectConstituency}
          selectedConstituencyKey={selectedConstituencyKey}
        />
      )}

      {/* Selected constituency results */}
      <div ref={resultsRef}>
        {selectedConstituencyKey && selectedResult && (
          <div className="mt-4">
            <SelectedConstituencyResults
              constituencyResult={selectedResult}
              onClose={handleCloseResults}
            />
          </div>
        )}
        {selectedConstituencyKey && !selectedResult && (
          <div className="mt-4 rounded-lg border border-surface-200 bg-surface-50 p-6 text-center text-ink-500 dark:border-surface-700 dark:bg-surface-800 dark:text-ink-400">
            {isNe ? 'यस क्षेत्रको नतिजा उपलब्ध छैन' : 'No results available for this constituency'}
          </div>
        )}
      </div>
    </div>
  );
}
