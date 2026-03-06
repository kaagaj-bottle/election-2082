import { Link } from 'react-router-dom';
import type { ConstituencyMinimal } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';

interface ConstituencyListProps {
  constituencies: ConstituencyMinimal[];
  provinceId?: number;
  districtId?: number;
}

export function ConstituencyList({ constituencies, provinceId, districtId }: ConstituencyListProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {constituencies.map((c) => (
        <Card key={c.id} className="transition-shadow hover:shadow-md">
          <h3 className="font-semibold text-ink-800 dark:text-ink-100">
            {isNe ? `निर्वाचन क्षेत्र ${c.number}` : `Constituency ${c.number}`}
          </h3>
          <div className="mt-2 flex gap-3 text-sm">
            <Link
              to={`/candidates?constituency=${c.id}`}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {isNe ? 'उम्मेदवार' : 'Candidates'}
            </Link>
            <Link
              to={`/results?province=${provinceId ?? ''}&district=${districtId ?? ''}&constituency=${c.id}`}
              className="text-green-600 hover:text-green-700 dark:text-green-400"
            >
              {isNe ? 'नतिजा' : 'Results'}
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}
