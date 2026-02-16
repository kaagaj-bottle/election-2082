import type { Province } from '@/types/api';
import { Card } from '@/components/ui/Card';

interface ProvinceListProps {
  provinces: Province[];
  onSelect: (province: Province) => void;
}

export function ProvinceList({ provinces, onSelect }: ProvinceListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {provinces.map((province) => (
        <button key={province.id} onClick={() => onSelect(province)} className="text-left">
          <Card className="transition-shadow hover:shadow-md">
            <h3 className="font-nepali text-base font-semibold text-ink-800 dark:text-ink-100">
              {province.name_ne}
            </h3>
            <p className="text-sm text-ink-500 dark:text-ink-400">{province.name}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
