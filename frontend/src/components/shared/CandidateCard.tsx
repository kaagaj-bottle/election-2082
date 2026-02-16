import { Link } from 'react-router-dom';
import type { CandidateListItem } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useLang } from '@/contexts/language-context';

interface CandidateCardProps {
  candidate: CandidateListItem;
}

const genderColor = {
  male: 'blue' as const,
  female: 'rose' as const,
  other: 'violet' as const,
};

const genderLabel = {
  male: { en: 'Male', ne: 'पुरुष' },
  female: { en: 'Female', ne: 'महिला' },
  other: { en: 'Other', ne: 'अन्य' },
};

export function CandidateCard({ candidate }: CandidateCardProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const primary = isNe ? candidate.name_ne : candidate.name;
  const secondary = isNe ? candidate.name : candidate.name_ne;
  const partyName = isNe ? candidate.party.name_ne : candidate.party.name;

  return (
    <Link to={`/candidates/${candidate.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex gap-4">
          <Avatar src={candidate.photo_url} name={candidate.name_ne || candidate.name} size="md" />
          <div className="min-w-0 flex-1">
            <h3
              className={`truncate text-base font-semibold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
            >
              {primary}
            </h3>
            {secondary && (
              <p
                className={`truncate text-sm text-ink-500 dark:text-ink-400 ${!isNe ? 'font-nepali' : ''}`}
              >
                {secondary}
              </p>
            )}
            <p
              className={`mt-1 truncate text-sm text-ink-600 dark:text-ink-300 ${isNe ? 'font-nepali' : ''}`}
            >
              {partyName}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color={genderColor[candidate.gender]}>
                {genderLabel[candidate.gender][lang]}
              </Badge>
              {candidate.age && (
                <Badge color="amber">
                  {isNe ? `उमेर ${candidate.age}` : `Age ${candidate.age}`}
                </Badge>
              )}
              {candidate.constituency && (
                <Badge color="teal">
                  {isNe
                    ? candidate.constituency.district.name_ne
                    : candidate.constituency.district.name}{' '}
                  - {candidate.constituency.number}
                </Badge>
              )}
              {candidate.votes_received > 0 && (
                <Badge color="green">
                  {candidate.votes_received.toLocaleString()} {isNe ? 'मत' : 'votes'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
