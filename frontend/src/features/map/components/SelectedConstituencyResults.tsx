import { useState } from 'react';
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

export function SelectedConstituencyResults({ constituencyResult, onClose }: Props) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const c = constituencyResult.constituency;
  const [expanded, setExpanded] = useState(false);

  const { data: candidates, isLoading } = useApi<CandidateListItem[]>(
    (signal) => getConstituencyResults(c.id, signal),
    [c.id],
  );

  const topVotes = candidates?.[0]?.votes_received ?? 0;
  const distName = isNe ? c.district.name_ne : c.district.name;
  const provName = isNe ? c.district.province.name_ne : c.district.province.name;
  const displayCandidates = expanded ? candidates : candidates?.slice(0, 2);

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <button
          type="button"
          className="flex flex-1 cursor-pointer items-center gap-2 text-left"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div>
            <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-200">
              {distName} – {isNe ? `क्षेत्र ${c.number}` : `Constituency ${c.number}`}
            </h3>
            <p className="text-xs text-ink-500 dark:text-ink-400">{provName}</p>
          </div>
          {candidates && candidates.length > 2 && <ChevronIcon expanded={expanded} />}
        </button>
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

      {displayCandidates && displayCandidates.length > 0 && !expanded && (
        <div className="space-y-2">
          {displayCandidates.map((cand, i) => (
            <div
              key={cand.id}
              className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                cand.status === 'Elected'
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : i === 0 && topVotes > 0
                    ? 'bg-green-50 dark:bg-green-900/10'
                    : 'bg-surface-50 dark:bg-surface-800/50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`/candidates/${cand.id}`}
                  className="font-medium text-ink-800 hover:text-primary-600 hover:underline dark:text-ink-100 dark:hover:text-primary-400"
                >
                  {isNe ? cand.name_ne : cand.name}
                </Link>
                <span className="ml-2 inline-flex items-center gap-1 text-ink-500 dark:text-ink-400">
                  <PartySymbol symbolImage={cand.party.symbol_image} size="xs" />
                  {isNe ? cand.party.name_ne : cand.party.name}
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
                      {cand.votes_received.toLocaleString()}
                    </span>
                    {cand.status === 'Elected' ? (
                      <Badge color="green">{isNe ? 'निर्वाचित' : 'Elected'}</Badge>
                    ) : i === 0 ? (
                      <Badge color="green">{isNe ? 'अग्रणी' : 'Leading'}</Badge>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {displayCandidates && displayCandidates.length > 0 && expanded && (
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
              {displayCandidates.map((cand, i) => (
                <tr
                  key={cand.id}
                  className={`border-b border-surface-100 last:border-0 dark:border-surface-800 ${
                    cand.status === 'Elected'
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : i === 0 && topVotes > 0
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : ''
                  }`}
                >
                  <td className="py-2 pr-2 tabular-nums text-ink-500 dark:text-ink-400">
                    {i + 1}
                  </td>
                  <td className="px-2 py-2">
                    <Link
                      to={`/candidates/${cand.id}`}
                      className="font-medium text-ink-800 hover:text-primary-600 hover:underline dark:text-ink-100 dark:hover:text-primary-400"
                    >
                      {isNe ? cand.name_ne : cand.name}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-ink-600 dark:text-ink-300">
                    <div className="flex items-center gap-1">
                      <PartySymbol symbolImage={cand.party.symbol_image} size="xs" />
                      {isNe ? cand.party.name_ne : cand.party.name}
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
                          {cand.votes_received.toLocaleString()}
                        </span>
                        {cand.status === 'Elected' ? (
                          <Badge color="green">{isNe ? 'निर्वाचित' : 'Elected'}</Badge>
                        ) : i === 0 ? (
                          <Badge color="green">{isNe ? 'अग्रणी' : 'Leading'}</Badge>
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
