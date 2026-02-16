import { Link } from 'react-router-dom';
import type { Party } from '@/types/api';
import { Card } from '@/components/ui/Card';

interface PartyCardProps {
  party: Party;
}

export function PartyCard({ party }: PartyCardProps) {
  return (
    <Link to={`/candidates?party=${party.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <h3 className="font-nepali text-base font-semibold text-ink-800 dark:text-ink-100">
          {party.name_ne}
        </h3>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{party.name}</p>
      </Card>
    </Link>
  );
}
