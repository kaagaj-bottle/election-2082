import type { Province } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';

interface ProvinceListProps {
  provinces: Province[];
  onSelect: (province: Province) => void;
}

export function ProvinceList({ provinces, onSelect }: ProvinceListProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {provinces.map((province) => {
        const primary = isNe ? province.name_ne : province.name;
        const secondary = isNe ? province.name : province.name_ne;
        return (
          <button key={province.id} onClick={() => onSelect(province)} className="text-left">
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
