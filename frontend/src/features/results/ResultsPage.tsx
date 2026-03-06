import { useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { getPartyTally, getProvinceSummary } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LastUpdatedBadge } from './components/LastUpdatedBadge';
import { PartyStandings } from './components/PartyStandings';
import { ProvinceSummaryGrid } from './components/ProvinceSummaryGrid';
import { ConstituencyResults } from './components/ConstituencyResults';
import type { PartyTally, ProvinceSummary } from '@/types/api';

export default function ResultsPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const partyTally = useApi<PartyTally[]>((signal) => getPartyTally(signal), []);
  const provinceSummary = useApi<ProvinceSummary[]>((signal) => getProvinceSummary(signal), []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const id = setInterval(() => {
      partyTally.refetch();
      provinceSummary.refetch();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [partyTally.refetch, provinceSummary.refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (partyTally.isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
          <Skeleton className="mb-4 h-5 w-32" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-surface-100 py-3 last:border-0 dark:border-surface-800">
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <Skeleton className="h-5 w-32" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (partyTally.error) {
    return <ErrorMessage message={partyTally.error} onRetry={partyTally.refetch} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100 sm:text-3xl">
            {isNe ? 'निर्वाचन नतिजा' : 'Election Results'}
          </h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {isNe
              ? 'प्रतिनिधि सभा निर्वाचन २०८२ — प्रत्यक्ष (FPTP)'
              : 'House of Representatives Election 2082 — FPTP'}
          </p>
          {partyTally.data && (() => {
            const declared = partyTally.data.reduce((s, p) => s + p.seats_won, 0);
            return (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-700">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${(declared / 165) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium tabular-nums text-ink-600 dark:text-ink-300">
                  {declared} / 165 {isNe ? 'सिट घोषित' : 'seats declared'}
                </span>
              </div>
            );
          })()}
        </div>
        <LastUpdatedBadge />
      </div>

      {partyTally.data && <PartyStandings data={partyTally.data} limit={10} />}

      {provinceSummary.data && <ProvinceSummaryGrid data={provinceSummary.data} />}

      <ConstituencyResults />
    </div>
  );
}
