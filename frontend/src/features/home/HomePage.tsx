import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getElections } from '@/services/elections';
import { getElection } from '@/services/elections';
import { getPartyTally, getProvinceSummary } from '@/services/results';
import { getParties } from '@/services/parties';
import { useLang } from '@/contexts/language-context';
import type { CursorPage, ElectionListItem, ElectionDetail, PartyTally, ProvinceSummary, Party } from '@/types/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LastUpdatedBadge } from '@/features/results/components/LastUpdatedBadge';
import { ProvinceSummaryGrid } from '@/features/results/components/ProvinceSummaryGrid';
import { PartySymbol } from '@/components/shared/PartySymbol';

export default function HomePage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const elections = useApi<CursorPage<ElectionListItem>>(
    (signal) => getElections(signal),
    [],
  );

  const activeElectionId = elections.data?.results.find((e) => e.is_active)?.id;

  const electionDetail = useApi<ElectionDetail | null>(
    (signal) => {
      if (!activeElectionId) return Promise.resolve(null);
      return getElection(activeElectionId, signal);
    },
    [activeElectionId],
  );

  const partyTally = useApi<PartyTally[]>((signal) => getPartyTally(signal), []);
  const provinceSummary = useApi<ProvinceSummary[]>((signal) => getProvinceSummary(signal), []);
  const parties = useApi<CursorPage<Party>>((signal) => getParties(undefined, signal), []);

  const topPrParties = parties.data
    ? [...parties.data.results].sort((a, b) => b.pr_votes_received - a.pr_votes_received).slice(0, 10)
    : [];

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const id = setInterval(() => {
      partyTally.refetch();
      provinceSummary.refetch();
    }, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [partyTally.refetch, provinceSummary.refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (elections.isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
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
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (elections.error) {
    return <ErrorMessage message={elections.error} onRetry={elections.refetch} />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-nepali text-xl font-bold text-ink-800 dark:text-ink-100 sm:text-2xl">
          {isNe ? 'नेपाल निर्वाचन २०८२' : 'Nepal Election 2082'}
        </h1>
        <p className="text-ink-500 dark:text-ink-400">
          {isNe ? 'प्रतिनिधि सभा निर्वाचन · डाटा ब्राउजर' : 'House of Representatives Election · Data Browser'}
        </p>
        {electionDetail.data && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600 dark:text-ink-300">
            <span>{isNe ? 'मिति' : 'Date'}: <span className="font-medium">{electionDetail.data.election_date}</span></span>
            <span>{isNe ? 'प्रत्यक्ष सिट' : 'FPTP Seats'}: <span className="font-medium">{electionDetail.data.total_seats_fptp}</span></span>
            <span>{isNe ? 'समानुपातिक सिट' : 'PR Seats'}: <span className="font-medium">{electionDetail.data.total_seats_pr}</span></span>
          </div>
        )}
      </div>

      {partyTally.data && partyTally.data.some((p) => p.total_votes > 0) ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-900/20">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100">
              {isNe ? 'प्रत्यक्ष नतिजा' : 'Live Results'}
            </h2>
            <LastUpdatedBadge />
          </div>
          <div className="space-y-1.5">
            {partyTally.data.slice(0, 5).map((p, i) => (
              <div key={p.party_id} className={`flex items-center justify-between ${i === 0 ? 'text-base font-bold' : 'text-sm'}`}>
                <Link
                  to={`/candidates?party=${p.party_id}`}
                  className="text-ink-700 hover:text-primary-600 hover:underline dark:text-ink-200 dark:hover:text-primary-400"
                >
                  {isNe ? p.party_name_ne : p.party_name}
                </Link>
                <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                  <span className="text-green-600 dark:text-green-400">{p.seats_won}</span>
                  {p.seats_leading > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">+{p.seats_leading}</span>
                  )}
                  {' '}{isNe ? 'सिट' : 'seats'}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/results"
            className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {isNe ? 'पूर्ण नतिजा हेर्नुहोस् →' : 'View full results →'}
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800 dark:border-primary-700 dark:bg-primary-900 dark:text-primary-200">
          <span className="mr-2 font-medium">ℹ</span>
          {isNe
            ? 'मतगणना जारी छ। नतिजा हेर्नुहोस्।'
            : 'Vote counting is underway. Check results page for updates.'}
          {' '}
          <Link to="/results" className="font-medium underline">
            {isNe ? 'नतिजा' : 'Results'}
          </Link>
        </div>
      )}

      {partyTally.data && partyTally.data.some((p) => p.total_votes > 0) && provinceSummary.data && (
        <div>
          <ProvinceSummaryGrid data={provinceSummary.data} />
        </div>
      )}

      {topPrParties.length > 0 && (
        <div className="rounded-lg border border-surface-200 px-4 py-3 dark:border-surface-700">
          <h2 className="mb-2 font-semibold text-ink-800 dark:text-ink-100">
            {isNe ? 'समानुपातिक मत' : 'PR Votes'}
          </h2>
          <div className="space-y-1.5">
            {topPrParties.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2 ${i === 0 ? 'text-base font-bold' : 'text-sm'}`}>
                <span className="w-5 text-right text-xs text-ink-400">{i + 1}</span>
                <PartySymbol symbolImage={p.symbol_image} size="xs" />
                <Link
                  to={`/candidates?party=${p.id}`}
                  className="truncate text-ink-700 hover:text-primary-600 hover:underline dark:text-ink-200 dark:hover:text-primary-400"
                >
                  {isNe ? p.name_ne : p.name}
                </Link>
                <span className="ml-auto shrink-0 font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                  {p.pr_votes_received.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/parties"
            className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {isNe ? 'सबै दलहरू हेर्नुहोस् →' : 'View all parties →'}
          </Link>
        </div>
      )}

    </div>
  );
}
