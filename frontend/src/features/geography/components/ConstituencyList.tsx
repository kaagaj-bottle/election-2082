import { useNavigate } from 'react-router-dom';
import type { ConstituencyMinimal } from '@/types/api';
import { Card } from '@/components/ui/Card';

interface ConstituencyListProps {
  constituencies: ConstituencyMinimal[];
}

export function ConstituencyList({ constituencies }: ConstituencyListProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {constituencies.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/candidates?constituency=${c.id}`)}
          className="text-left"
        >
          <Card className="transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-ink-800 dark:text-ink-100">
              Constituency {c.number}
            </h3>
            <p className="text-sm text-primary-600 dark:text-primary-400">View candidates</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
