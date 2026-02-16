import { Link } from 'react-router-dom';
import type { CandidateListItem } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface CandidateCardProps {
  candidate: CandidateListItem;
}

const genderColor = {
  male: 'blue' as const,
  female: 'rose' as const,
  other: 'violet' as const,
};

const genderLabel = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Link to={`/candidates/${candidate.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex gap-4">
          <Avatar src={candidate.photo_url} name={candidate.name_ne || candidate.name} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-nepali text-base font-semibold text-ink-800 dark:text-ink-100">
              {candidate.name_ne}
            </h3>
            <p className="truncate text-sm text-ink-500 dark:text-ink-400">{candidate.name}</p>
            <p className="mt-1 truncate text-sm text-ink-600 dark:text-ink-300">
              {candidate.party.name_ne}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color={genderColor[candidate.gender]}>{genderLabel[candidate.gender]}</Badge>
              {candidate.age && <Badge color="amber">Age {candidate.age}</Badge>}
              {candidate.constituency && (
                <Badge color="teal">
                  {candidate.constituency.district.name} - {candidate.constituency.number}
                </Badge>
              )}
              {candidate.votes_received > 0 && (
                <Badge color="green">{candidate.votes_received.toLocaleString()} votes</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
