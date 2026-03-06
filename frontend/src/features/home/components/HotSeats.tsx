import { useEffect, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getHotSeats } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { PartySymbol } from '@/components/shared/PartySymbol';
import type { HotSeat } from '@/types/api';

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-ink-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function HotSeats() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const hotSeats = useApi<HotSeat[]>((signal) => getHotSeats(signal), []);

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-refresh every 2 minutes
  const refresh = useCallback(() => {
    hotSeats.refetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(refresh, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [refresh]);

  if (hotSeats.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (!hotSeats.data || hotSeats.data.length === 0) return null;

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-ink-800 dark:text-ink-100">
        {isNe ? 'चर्चित सिट' : 'Hot Seats'}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {hotSeats.data.map((seat) => {
          const topVotes = seat.candidates[0]?.votes_received ?? 0;
          const district = seat.constituency.district;
          const isExpanded = expanded.has(seat.constituency.id);
          const displayCandidates = isExpanded
            ? seat.candidates
            : seat.candidates.slice(0, 2);

          return (
            <Card key={seat.constituency.id}>
              <button
                type="button"
                className="mb-3 flex w-full cursor-pointer items-center justify-between text-left"
                onClick={() => toggleExpanded(seat.constituency.id)}
              >
                <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-200">
                  {isNe ? district.name_ne : district.name} –{' '}
                  {isNe ? 'क्षेत्र' : 'Constituency'} {seat.constituency.number}
                </h3>
                <ChevronIcon expanded={isExpanded} />
              </button>

              {/* Compact view: top 2 candidates as rows */}
              {!isExpanded && (
                <div className="space-y-2">
                  {displayCandidates.map((c, i) => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                        i === 0 && topVotes > 0
                          ? 'bg-green-50 dark:bg-green-900/10'
                          : 'bg-surface-50 dark:bg-surface-800/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/candidates/${c.id}`}
                          className="font-medium text-ink-800 hover:text-primary-600 hover:underline dark:text-ink-100 dark:hover:text-primary-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isNe ? c.name_ne : c.name}
                        </Link>
                        <span className="ml-2 inline-flex items-center gap-1 text-ink-500 dark:text-ink-400">
                          <PartySymbol symbolImage={c.party.symbol_image} size="xs" />
                          {isNe ? c.party.name_ne : c.party.name}
                        </span>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1.5">
                        {topVotes === 0 ? (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            {isNe ? 'प्रतीक्षामा' : 'Pending'}
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                              {c.votes_received.toLocaleString()}
                            </span>
                            {i === 0 && (
                              <Badge color="green">{isNe ? 'अग्रणी' : 'Leading'}</Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded view: full candidate table */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 dark:border-surface-700">
                        <th className="py-1.5 pr-2 text-left font-medium text-ink-500 dark:text-ink-400">
                          #
                        </th>
                        <th className="px-2 py-1.5 text-left font-medium text-ink-500 dark:text-ink-400">
                          {isNe ? 'उम्मेदवार' : 'Candidate'}
                        </th>
                        <th className="px-2 py-1.5 text-left font-medium text-ink-500 dark:text-ink-400">
                          {isNe ? 'दल' : 'Party'}
                        </th>
                        <th className="px-2 py-1.5 text-right font-medium text-ink-500 dark:text-ink-400">
                          {isNe ? 'मत' : 'Votes'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCandidates.map((c, i) => (
                        <tr
                          key={c.id}
                          className={`border-b border-surface-100 last:border-0 dark:border-surface-800 ${
                            i === 0 && topVotes > 0 ? 'bg-green-50 dark:bg-green-900/10' : ''
                          }`}
                        >
                          <td className="py-2 pr-2 tabular-nums text-ink-500 dark:text-ink-400">
                            {i + 1}
                          </td>
                          <td className="px-2 py-2">
                            <Link
                              to={`/candidates/${c.id}`}
                              className="font-medium text-ink-800 hover:text-primary-600 hover:underline dark:text-ink-100 dark:hover:text-primary-400"
                            >
                              {isNe ? c.name_ne : c.name}
                            </Link>
                          </td>
                          <td className="px-2 py-2 text-ink-600 dark:text-ink-300">
                            <div className="flex items-center gap-1">
                              <PartySymbol symbolImage={c.party.symbol_image} size="xs" />
                              {isNe ? c.party.name_ne : c.party.name}
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right">
                            {topVotes === 0 ? (
                              <span className="text-sm text-amber-600 dark:text-amber-400">
                                {isNe ? 'नतिजा प्रतीक्षामा' : 'Awaiting Results'}
                              </span>
                            ) : (
                              <>
                                <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                                  {c.votes_received.toLocaleString()}
                                </span>
                                {i === 0 && (
                                  <Badge color="green">{isNe ? 'अग्रणी' : 'Leading'}</Badge>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
