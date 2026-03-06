import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getElections } from '@/services/elections';
import { getElection } from '@/services/elections';
import { getProvinces } from '@/services/provinces';
import { getParties } from '@/services/parties';
import { getPartyTally } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import type { CursorPage, ElectionListItem, ElectionDetail, Province, Party, PartyTally } from '@/types/api';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LastUpdatedBadge } from '@/features/results/components/LastUpdatedBadge';
import { ElectionSummary } from './components/ElectionSummary';
import { StatsGrid } from './components/StatsGrid';
import { HotSeats } from './components/HotSeats';
import { QuickLinks } from './components/QuickLinks';

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

  const provinces = useApi<CursorPage<Province>>(
    (signal) => getProvinces(signal),
    [],
  );

  const parties = useApi<CursorPage<Party>>(
    (signal) => getParties(undefined, signal),
    [],
  );

  const partyTally = useApi<PartyTally[]>((signal) => getPartyTally(signal), []);

  if (elections.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (elections.error) {
    return <ErrorMessage message={elections.error} onRetry={elections.refetch} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100 sm:text-3xl">
          नेपाल निर्वाचन २०८२
        </h1>
        <p className="mt-1 text-ink-500 dark:text-ink-400">
          {isNe ? 'नेपाल निर्वाचन २०८२ डाटा ब्राउजर' : 'Nepal Election 2082 Data Browser'}
        </p>
      </div>

      {partyTally.data && partyTally.data.some((p) => p.total_votes > 0) ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100">
              {isNe ? 'प्रत्यक्ष नतिजा' : 'Live Results'}
            </h2>
            <LastUpdatedBadge />
          </div>
          <div className="space-y-1.5">
            {partyTally.data.slice(0, 5).map((p) => (
              <div key={p.party_id} className="flex items-center justify-between text-sm">
                <span className="text-ink-700 dark:text-ink-200">
                  {isNe ? p.party_name_ne : p.party_name}
                </span>
                <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                  {p.seats_won} {isNe ? 'सिट' : 'seats'}
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/results"
            className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
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

      <HotSeats />

      {electionDetail.data && <ElectionSummary election={electionDetail.data} />}

      <StatsGrid
        provinceCount={provinces.data?.results.length ?? 0}
        districtCount={electionDetail.data?.total_districts ?? 0}
        constituencyCount={electionDetail.data?.total_seats_fptp ?? 0}
        partyCount={parties.data?.results.length ?? 0}
      />

      <QuickLinks />
    </div>
  );
}
