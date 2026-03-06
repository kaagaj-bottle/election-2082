import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/language-context';
import { Card } from '@/components/ui/Card';
import type { ProvinceSummary } from '@/types/api';

interface ProvinceSummaryGridProps {
  data: ProvinceSummary[];
}

export function ProvinceSummaryGrid({ data }: ProvinceSummaryGridProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
        {isNe ? 'प्रदेशगत सारांश' : 'Province Summary'}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((prov) => (
          <Link key={prov.province_id} to={`/results/province/${prov.province_id}`}>
            <Card className="transition-all hover:border-primary-300 hover:shadow-md dark:hover:border-primary-600 cursor-pointer">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-800 dark:text-ink-100">
                  {isNe ? prov.province_name_ne : prov.province_name}
                </h3>
                <svg
                  className="h-4 w-4 text-ink-400 dark:text-ink-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-ink-500 dark:text-ink-400">
                  {isNe ? 'क्षेत्र' : 'Constituencies'}
                </span>
                <span className="text-right font-medium tabular-nums text-ink-800 dark:text-ink-100">
                  {prov.total_constituencies}
                </span>
                <span className="text-ink-500 dark:text-ink-400">
                  {isNe ? 'उम्मेदवार' : 'Candidates'}
                </span>
                <span className="text-right font-medium tabular-nums text-ink-800 dark:text-ink-100">
                  {prov.total_candidates.toLocaleString()}
                </span>
                <span className="text-ink-500 dark:text-ink-400">
                  {isNe ? 'कुल मत' : 'Total Votes'}
                </span>
                <span className="text-right font-medium tabular-nums text-ink-800 dark:text-ink-100">
                  {prov.total_votes.toLocaleString()}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
