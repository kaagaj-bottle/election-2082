import type { DistrictMinimal } from '@/types/api';
import { Card } from '@/components/ui/Card';

interface DistrictListProps {
  districts: DistrictMinimal[];
  onSelect: (district: DistrictMinimal) => void;
}

export function DistrictList({ districts, onSelect }: DistrictListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {districts.map((district) => (
        <button key={district.id} onClick={() => onSelect(district)} className="text-left">
          <Card className="transition-shadow hover:shadow-md">
            <h3 className="font-nepali text-base font-semibold text-ink-800 dark:text-ink-100">
              {district.name_ne}
            </h3>
            <p className="text-sm text-ink-500 dark:text-ink-400">{district.name}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
