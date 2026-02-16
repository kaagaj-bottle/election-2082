import type { ElectionDetail } from '@/types/api';
import { Card } from '@/components/ui/Card';

interface ElectionSummaryProps {
  election: ElectionDetail;
}

export function ElectionSummary({ election }: ElectionSummaryProps) {
  return (
    <Card>
      <h2 className="font-nepali text-xl font-bold text-ink-800 dark:text-ink-100">
        {election.name_ne}
      </h2>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{election.name}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-400 dark:text-ink-500">Election Date</p>
          <p className="font-medium text-ink-700 dark:text-ink-200">{election.election_date}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400 dark:text-ink-500">FPTP Seats</p>
          <p className="font-medium text-ink-700 dark:text-ink-200">{election.total_seats_fptp}</p>
        </div>
        <div>
          <p className="text-xs text-ink-400 dark:text-ink-500">PR Seats</p>
          <p className="font-medium text-ink-700 dark:text-ink-200">{election.total_seats_pr}</p>
        </div>
      </div>
    </Card>
  );
}
