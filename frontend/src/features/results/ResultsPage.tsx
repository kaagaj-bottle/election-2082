import { useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { getPartyTally, getProvinceSummary } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Spinner } from '@/components/ui/Spinner';
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
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
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
        </div>
        <LastUpdatedBadge />
      </div>

      {partyTally.data && <PartyStandings data={partyTally.data} />}

      {provinceSummary.data && <ProvinceSummaryGrid data={provinceSummary.data} />}

      <ConstituencyResults />
    </div>
  );
}
