import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getProvinceResults } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PartySymbol } from '@/components/shared/PartySymbol';
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

  const [districtSearch, setDistrictSearch] = useState('');

  const filteredResults = useMemo(() => {
    if (!results.data) return null;
    if (!districtSearch.trim()) return results.data;
    const q = districtSearch.trim().toLowerCase();
    return results.data.filter(
      (item) =>
        item.constituency.district.name.toLowerCase().includes(q) ||
        item.constituency.district.name_ne.includes(q),
    );
  }, [results.data, districtSearch]);

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

      {results.data && results.data.length > 0 && (
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={districtSearch}
            onChange={(e) => setDistrictSearch(e.target.value)}
            placeholder={isNe ? 'जिल्ला खोज्नुहोस्...' : 'Search district...'}
            className="w-full rounded border border-surface-300 bg-white py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:placeholder:text-ink-500 sm:max-w-xs"
          />
        </div>
      )}

      {filteredResults && filteredResults.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResults.map((item) => {
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
                        <Link to={`/candidates/${c.id}`} className="hover:text-primary-600 hover:underline dark:hover:text-primary-400">
                          <div className="truncate font-medium text-ink-800 dark:text-ink-100">
                            {isNe ? c.name_ne : c.name}
                          </div>
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                          <PartySymbol symbolImage={c.party.symbol_image} size="xs" />
                          <span className="truncate">{isNe ? c.party.name_ne : c.party.name}</span>
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        {item.total_votes === 0 ? (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            {isNe ? 'नतिजा प्रतीक्षामा' : 'Awaiting Results'}
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                              {c.votes_received.toLocaleString()}
                            </span>
                            {i === 0 && topVotes > 0 && (
                              <Badge color="green">{isNe ? 'अग्रणी' : 'Lead'}</Badge>
                            )}
                          </>
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
      ) : filteredResults && filteredResults.length === 0 && districtSearch.trim() ? (
        <p className="py-10 text-center text-sm text-ink-400">
          {isNe ? 'कुनै जिल्ला भेटिएन।' : 'No districts match your search.'}
        </p>
      ) : !results.data?.length ? (
        <p className="py-10 text-center text-sm text-ink-400">
          {isNe ? 'यस प्रदेशको नतिजा उपलब्ध छैन।' : 'No results available for this province.'}
        </p>
      ) : null}
    </div>
  );
}
