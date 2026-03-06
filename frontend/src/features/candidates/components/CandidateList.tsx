import type { CandidateListItem } from '@/types/api';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface CandidateListProps {
  items: CandidateListItem[];
  isLoading: boolean;
  error: string | null;
}

export function CandidateList({ items, isLoading, error }: CandidateListProps) {
  if (isLoading && items.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-lg border border-surface-200 p-4 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (items.length === 0) {
    return <EmptyState title="No candidates found" description="Try adjusting your search or filters." />;
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-50/60 dark:bg-surface-950/60">
          <Spinner size="md" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
