import { useLang } from '@/contexts/language-context';
import { Card } from '@/components/ui/Card';
import type { PartyTally } from '@/types/api';

interface PartyStandingsProps {
  data: PartyTally[];
  limit?: number;
}

export function PartyStandings({ data, limit }: PartyStandingsProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const rows = limit ? data.slice(0, limit) : data;
  const maxSeats = Math.max(...data.map((p) => p.seats_won), 1);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
        {isNe ? 'दलगत नतिजा' : 'Party Standings'}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 dark:border-surface-700">
              <th className="py-2 pr-3 text-left font-medium text-ink-500 dark:text-ink-400">
                {isNe ? 'दल' : 'Party'}
              </th>
              <th className="px-3 py-2 text-right font-medium text-ink-500 dark:text-ink-400">
                {isNe ? 'सिट' : 'Seats'}
              </th>
              <th className="hidden px-3 py-2 text-left font-medium text-ink-500 dark:text-ink-400 sm:table-cell">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((party) => (
              <tr
                key={party.party_id}
                className="border-b border-surface-100 last:border-0 dark:border-surface-800"
              >
                <td className="py-2.5 pr-3 font-medium text-ink-800 dark:text-ink-100">
                  {isNe ? party.party_name_ne : party.party_name}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                  {party.seats_won}
                </td>
                <td className="hidden w-40 px-3 py-2.5 sm:table-cell">
                  <div className="h-3 rounded-full bg-surface-100 dark:bg-surface-800">
                    <div
                      className="h-3 rounded-full bg-primary-500 transition-all"
                      style={{ width: `${(party.seats_won / maxSeats) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
