import { useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/use-api';
import { getHotSeats } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { HotSeat } from '@/types/api';

export function HotSeats() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const hotSeats = useApi<HotSeat[]>((signal) => getHotSeats(signal), []);

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
      <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
        {isNe ? 'चर्चित सिट' : 'Hot Seats'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {hotSeats.data.map((seat) => {
          const topVotes = seat.candidates[0]?.votes_received ?? 0;
          const district = seat.constituency.district;

          return (
            <Card key={seat.constituency.id}>
              <h3 className="mb-3 text-sm font-semibold text-ink-700 dark:text-ink-200">
                {isNe ? district.name_ne : district.name} –{' '}
                {isNe ? 'क्षेत्र' : 'Constituency'} {seat.constituency.number}
              </h3>
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
                    {seat.candidates.slice(0, 5).map((c, i) => (
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
                          <div className="font-medium text-ink-800 dark:text-ink-100">
                            {isNe ? c.name_ne : c.name}
                          </div>
                        </td>
                        <td className="px-2 py-2 text-ink-600 dark:text-ink-300">
                          {isNe ? c.party.name_ne : c.party.name}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                            {c.votes_received.toLocaleString()}
                          </span>
                          {i === 0 && topVotes > 0 && (
                            <Badge color="green">{isNe ? 'अग्रणी' : 'Leading'}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
