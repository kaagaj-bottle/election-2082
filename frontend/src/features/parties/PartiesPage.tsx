import { useState, useMemo } from 'react';
import { useCursorPagination } from '@/hooks/use-cursor-pagination';
import { useApi } from '@/hooks/use-api';
import { getParties, getPartiesByUrl } from '@/services/parties';
import { getPartyTally } from '@/services/results';
import { SearchInput } from '@/components/shared/SearchInput';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { PartyCard } from './components/PartyCard';
import { useLang } from '@/contexts/language-context';
import type { Party, PartyTally } from '@/types/api';

export default function PartiesPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const [search, setSearch] = useState('');
  const params = useMemo(() => (search ? { search } : {}), [search]);
  const tally = useApi<PartyTally[]>((signal) => getPartyTally(signal), []);
  const tallyMap = useMemo(() => new Map(tally.data?.map(t => [t.party_id, t])), [tally.data]);

  const { items, isLoading, error, hasNext, hasPrevious, goNext, goPrevious } =
    useCursorPagination<Party>(
      (p, signal) => getParties(p, signal),
      (url, signal) => getPartiesByUrl(url, signal),
      params,
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">{isNe ? 'दलहरू' : 'Parties'}</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {isNe ? 'निर्वाचनमा भाग लिने राजनीतिक दलहरू' : 'Political parties in the election'}
        </p>
      </div>

      <SearchInput
        value={search}
        onChange={(v) => setSearch(v)}
        placeholder={isNe ? 'दलको नाम खोज्नुहोस्...' : 'Search by party name...'}
      />

      {isLoading && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : items.length === 0 ? (
        <EmptyState title={isNe ? 'कुनै दल भेटिएन' : 'No parties found'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((party) => (
            <PartyCard key={party.id} party={party} tally={tallyMap?.get(party.id)} />
          ))}
        </div>
      )}

      <PaginationControls
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPrevious={goPrevious}
        onNext={goNext}
        isLoading={isLoading}
      />
    </div>
  );
}
