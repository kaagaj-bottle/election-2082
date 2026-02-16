import type { ElectionDetail } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';

interface ElectionSummaryProps {
  election: ElectionDetail;
}

export function ElectionSummary({ election }: ElectionSummaryProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const primary = isNe ? election.name_ne : election.name;
  const secondary = isNe ? election.name : election.name_ne;

  return (
    <Card>
      <h2
        className={`text-xl font-bold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
      >
        {primary}
      </h2>
      <p className={`mt-1 text-sm text-ink-500 dark:text-ink-400 ${!isNe ? 'font-nepali' : ''}`}>
        {secondary}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-400 dark:text-ink-500">
            {isNe ? 'निर्वाचन मिति' : 'Election Date'}
          </p>
          <p className="font-medium text-ink-700 dark:text-ink-200">{election.election_date}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400 dark:text-ink-500">
            {isNe ? 'FPTP सिट' : 'FPTP Seats'}
          </p>
          <p className="font-medium text-ink-700 dark:text-ink-200">{election.total_seats_fptp}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400 dark:text-ink-500">
            {isNe ? 'PR सिट' : 'PR Seats'}
          </p>
          <p className="font-medium text-ink-700 dark:text-ink-200">{election.total_seats_pr}</p>
        </div>
      </div>
    </Card>
  );
}
