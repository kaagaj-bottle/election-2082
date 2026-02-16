import { useCursorPagination } from '@/hooks/use-cursor-pagination';
import { getParties, getPartiesByUrl } from '@/services/parties';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { PartyCard } from './components/PartyCard';
import { useLang } from '@/contexts/language-context';
import type { Party } from '@/types/api';

const emptyParams = {};

export default function PartiesPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const { items, isLoading, error, hasNext, hasPrevious, goNext, goPrevious } =
    useCursorPagination<Party>(
      (_params, signal) => getParties(signal),
      (url, signal) => getPartiesByUrl(url, signal),
      emptyParams,
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">दलहरू</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {isNe ? 'निर्वाचनमा भाग लिने राजनीतिक दलहरू' : 'Political parties in the election'}
        </p>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : items.length === 0 ? (
        <EmptyState title={isNe ? 'कुनै दल भेटिएन' : 'No parties found'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((party) => (
            <PartyCard key={party.id} party={party} />
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
