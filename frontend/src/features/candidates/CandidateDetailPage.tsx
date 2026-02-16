import { useParams, Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getCandidate } from '@/services/candidates';
import { useLang } from '@/contexts/language-context';
import type { CandidateDetail } from '@/types/api';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CandidateProfile } from './components/CandidateProfile';

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const { data, isLoading, error, refetch } = useApi<CandidateDetail>(
    (signal) => getCandidate(id!, signal),
    [id],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorMessage message={error ?? 'Candidate not found'} onRetry={refetch} />;
  }

  return (
    <div className="space-y-4">
      <Link
        to="/candidates"
        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {isNe ? 'उम्मेदवार सूचीमा फर्कनुहोस्' : 'Back to candidates'}
      </Link>
      <CandidateProfile candidate={data} />
    </div>
  );
}
