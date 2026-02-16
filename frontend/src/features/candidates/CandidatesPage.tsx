import { useFilters } from '@/hooks/use-filters';
import { useCursorPagination } from '@/hooks/use-cursor-pagination';
import { getCandidates, getCandidatesByUrl } from '@/services/candidates';
import { SearchInput } from '@/components/shared/SearchInput';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { CandidateFilters } from './components/CandidateFilters';
import { CandidateList } from './components/CandidateList';
import type { CandidateListItem } from '@/types/api';

export default function CandidatesPage() {
  const { filters, setFilter, clearFilters } = useFilters();

  const { items, isLoading, error, hasNext, hasPrevious, goNext, goPrevious } =
    useCursorPagination<CandidateListItem>(
      (params, signal) => getCandidates(params, signal),
      (url, signal) => getCandidatesByUrl(url, signal),
      filters,
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">
          उम्मेदवारहरू
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Browse and search election candidates
        </p>
      </div>

      <SearchInput
        value={filters.search ?? ''}
        onChange={(value) => setFilter('search', value || undefined)}
        placeholder="Search by name..."
      />

      <CandidateFilters filters={filters} setFilter={setFilter} clearFilters={clearFilters} />

      <CandidateList items={items} isLoading={isLoading} error={error} />

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
