import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getProvinceResults } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { ProvinceConstituencyResult } from '@/types/api';

export default function ProvinceResultsPage() {
  const { provinceId } = useParams<{ provinceId: string }>();
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const results = useApi<ProvinceConstituencyResult[]>(
    (signal) => getProvinceResults(Number(provinceId), signal),
    [provinceId],
  );

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const id = setInterval(() => results.refetch(), 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [results.refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  const provinceName = results.data?.[0]?.constituency.district.province;
  const title = provinceName
    ? isNe
      ? provinceName.name_ne
      : provinceName.name
    : isNe
      ? `प्रदेश ${provinceId}`
      : `Province ${provinceId}`;

  if (results.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (results.error) {
    return <ErrorMessage message={results.error} onRetry={results.refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/results"
          className="mb-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {isNe ? 'नतिजामा फर्कनुहोस्' : 'Back to Results'}
        </Link>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {isNe
            ? `${results.data?.length ?? 0} क्षेत्रको नतिजा`
            : `Results for ${results.data?.length ?? 0} constituencies`}
        </p>
      </div>

      {results.data && results.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.data.map((item) => {
            const topVotes = item.top_candidates[0]?.votes_received ?? 0;
            return (
              <Card key={item.constituency.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-ink-800 dark:text-ink-100">
                    {isNe
                      ? `${item.constituency.district.name_ne} - ${item.constituency.number}`
                      : `${item.constituency.district.name} - ${item.constituency.number}`}
                  </h3>
                  <span className="text-xs text-ink-400">
                    {item.candidates_count} {isNe ? 'उम्मेदवार' : 'candidates'}
                  </span>
                </div>

                <div className="space-y-2">
                  {item.top_candidates.map((c, i) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${
                        i === 0 && topVotes > 0
                          ? 'bg-green-50 dark:bg-green-900/10'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-ink-800 dark:text-ink-100">
                          {isNe ? c.name_ne : c.name}
                        </div>
                        <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                          {isNe ? c.party.name_ne : c.party.name}
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                          {c.votes_received.toLocaleString()}
                        </span>
                        {i === 0 && topVotes > 0 && (
                          <Badge color="green">{isNe ? 'अग्रणी' : 'Lead'}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {item.total_votes > 0 && (
                  <div className="mt-3 border-t border-surface-200 pt-2 text-right text-xs text-ink-500 dark:border-surface-700 dark:text-ink-400">
                    {isNe ? 'कुल मत' : 'Total votes'}: {item.total_votes.toLocaleString()}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-ink-400">
          {isNe ? 'यस प्रदेशको नतिजा उपलब्ध छैन।' : 'No results available for this province.'}
        </p>
      )}
    </div>
  );
}
