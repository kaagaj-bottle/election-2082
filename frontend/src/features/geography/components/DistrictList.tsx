import type { DistrictMinimal } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';

interface DistrictListProps {
  districts: DistrictMinimal[];
  onSelect: (district: DistrictMinimal) => void;
}

export function DistrictList({ districts, onSelect }: DistrictListProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {districts.map((district) => {
        const primary = isNe ? district.name_ne : district.name;
        const secondary = isNe ? district.name : district.name_ne;
        return (
          <button key={district.id} onClick={() => onSelect(district)} className="text-left">
            <Card className="transition-shadow hover:shadow-md">
              <h3
                className={`text-base font-semibold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
              >
                {primary}
              </h3>
              <p
                className={`text-sm text-ink-500 dark:text-ink-400 ${!isNe ? 'font-nepali' : ''}`}
              >
                {secondary}
              </p>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
