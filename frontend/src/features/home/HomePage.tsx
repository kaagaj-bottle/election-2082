import { useApi } from '@/hooks/use-api';
import { getElections } from '@/services/elections';
import { getElection } from '@/services/elections';
import { getProvinces } from '@/services/provinces';
import { getParties } from '@/services/parties';
import { useLang } from '@/contexts/language-context';
import type { CursorPage, ElectionListItem, ElectionDetail, Province, Party } from '@/types/api';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElectionSummary } from './components/ElectionSummary';
import { StatsGrid } from './components/StatsGrid';
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
    (signal) => getParties(signal),
    [],
  );

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

      {electionDetail.data && <ElectionSummary election={electionDetail.data} />}

      <StatsGrid
        provinceCount={provinces.data?.results.length ?? 0}
        districtCount={0}
        constituencyCount={electionDetail.data?.total_seats_fptp ?? 0}
        partyCount={parties.data?.results.length ?? 0}
      />

      <QuickLinks />
    </div>
  );
}
