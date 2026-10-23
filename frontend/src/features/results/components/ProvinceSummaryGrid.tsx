import { Link } from 'react-router-dom';
import { useLang } from '@/contexts/language-context';
import type { ProvinceSummary } from '@/types/api';

interface ProvinceSummaryGridProps {
  data: ProvinceSummary[];
}

export function ProvinceSummaryGrid({ data }: ProvinceSummaryGridProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-ink-800 dark:text-ink-100">
        {isNe ? 'प्रदेशहरू' : 'Provinces'}
      </h2>
      <div className="flex flex-wrap gap-2">
        {data.map((prov) => (
          <Link
            key={prov.province_id}
            to={`/results/province/${prov.province_id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 shadow-xs transition-all hover:border-primary-300 hover:shadow-md dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:hover:border-primary-600"
          >
            {isNe ? prov.province_name_ne : prov.province_name}
            <svg className="h-3.5 w-3.5 text-ink-400 dark:text-ink-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
