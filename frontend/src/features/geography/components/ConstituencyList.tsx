import { useNavigate } from 'react-router-dom';
import type { ConstituencyMinimal } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';

interface ConstituencyListProps {
  constituencies: ConstituencyMinimal[];
}

export function ConstituencyList({ constituencies }: ConstituencyListProps) {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isNe = lang === 'ne';

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
              {isNe ? `निर्वाचन क्षेत्र ${c.number}` : `Constituency ${c.number}`}
            </h3>
            <p className="text-sm text-primary-600 dark:text-primary-400">
              {isNe ? 'उम्मेदवार हेर्नुहोस्' : 'View candidates'}
            </p>
          </Card>
        </button>
      ))}
    </div>
  );
}
