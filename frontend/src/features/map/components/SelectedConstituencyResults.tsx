import { Link } from 'react-router-dom';
import { useApi } from '@/hooks/use-api';
import { getConstituencyResults } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { PartySymbol } from '@/components/shared/PartySymbol';
import type { CandidateListItem, ProvinceConstituencyResult } from '@/types/api';

interface Props {
  constituencyResult: ProvinceConstituencyResult;
  onClose: () => void;
}

export function SelectedConstituencyResults({ constituencyResult, onClose }: Props) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const c = constituencyResult.constituency;

  const { data: candidates, isLoading } = useApi<CandidateListItem[]>(
    (signal) => getConstituencyResults(c.id, signal),
    [c.id],
  );

  const topVotes = candidates?.[0]?.votes_received ?? 0;
  const distName = isNe ? c.district.name_ne : c.district.name;
  const provName = isNe ? c.district.province.name_ne : c.district.province.name;

  return (
    <Card className="mt-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-ink-800 dark:text-ink-100">
            {distName} - {isNe ? `क्षेत्र ${c.number}` : `Constituency ${c.number}`}
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-400">{provName}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-ink-400 hover:bg-surface-200 hover:text-ink-600 dark:hover:bg-surface-700 dark:hover:text-ink-300"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      )}

      {candidates && candidates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="py-2 pr-3 text-left font-medium text-ink-500 dark:text-ink-400">#</th>
                <th className="px-3 py-2 text-left font-medium text-ink-500 dark:text-ink-400">
                  {isNe ? 'उम्मेदवार' : 'Candidate'}
                </th>
                <th className="px-3 py-2 text-left font-medium text-ink-500 dark:text-ink-400">
                  {isNe ? 'दल' : 'Party'}
                </th>
                <th className="px-3 py-2 text-right font-medium text-ink-500 dark:text-ink-400">
                  {isNe ? 'मत' : 'Votes'}
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand, i) => (
                <tr
                  key={cand.id}
                  className={`border-b border-surface-100 last:border-0 dark:border-surface-800 ${
                    cand.status === 'Elected'
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : i === 0 && topVotes > 0
                        ? 'bg-amber-50 dark:bg-amber-900/10'
                        : ''
                  }`}
                >
                  <td className="py-2.5 pr-3 tabular-nums text-ink-500 dark:text-ink-400">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <Link
                      to={`/candidates/${cand.id}`}
                      className="hover:text-primary-600 hover:underline dark:hover:text-primary-400"
                    >
                      <div className="font-medium text-ink-800 dark:text-ink-100">
                        {isNe ? cand.name_ne : cand.name}
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-ink-600 dark:text-ink-300">
                    <div className="flex items-center gap-2">
                      <PartySymbol symbolImage={cand.party.symbol_image} size="sm" />
                      {isNe ? cand.party.name_ne : cand.party.name}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {topVotes === 0 ? (
                      <span className="text-sm text-amber-600 dark:text-amber-400">
                        {isNe ? 'नतिजा प्रतीक्षामा' : 'Awaiting Results'}
                      </span>
                    ) : (
                      <>
                        <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                          {cand.votes_received.toLocaleString()}
                        </span>
                        {cand.status === 'Elected' ? (
                          <Badge color="green">{isNe ? 'निर्वाचित' : 'Elected'}</Badge>
                        ) : i === 0 && topVotes > 0 ? (
                          <Badge color="amber">{isNe ? 'अग्रणी' : 'Leading'}</Badge>
                        ) : null}
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
}
