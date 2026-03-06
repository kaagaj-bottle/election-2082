import { Link } from 'react-router-dom';
import type { Party } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';
import { PartySymbol } from '@/components/shared/PartySymbol';

interface PartyCardProps {
  party: Party;
}

export function PartyCard({ party }: PartyCardProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const primary = isNe ? party.name_ne : party.name;
  const secondary = isNe ? party.name : party.name_ne;

  return (
    <Link to={`/candidates?party=${party.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <PartySymbol symbolImage={party.symbol_image} size="xl" />
          <div className="min-w-0 flex-1">
            <h3
              className={`text-base font-semibold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
            >
              {primary}
            </h3>
            {secondary && (
              <p
                className={`mt-1 text-sm text-ink-500 dark:text-ink-400 ${!isNe ? 'font-nepali' : ''}`}
              >
                {secondary}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
