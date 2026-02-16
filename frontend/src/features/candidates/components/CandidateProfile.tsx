import type { CandidateDetail } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface CandidateProfileProps {
  candidate: CandidateDetail;
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

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-sm text-ink-500 dark:text-ink-400">{label}</dt>
      <dd className="text-sm text-ink-800 dark:text-ink-100">{value}</dd>
    </div>
  );
}

export function CandidateProfile({ candidate }: CandidateProfileProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <Avatar src={candidate.photo_url} name={candidate.name_ne || candidate.name} size="lg" />
          <div className="flex-1">
            <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">
              {candidate.name_ne}
            </h1>
            <p className="text-lg text-ink-500 dark:text-ink-400">{candidate.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color={genderColor[candidate.gender]}>{genderLabel[candidate.gender]}</Badge>
              {candidate.age && <Badge color="amber">Age {candidate.age}</Badge>}
              <Badge color="indigo">{candidate.election_type.toUpperCase()}</Badge>
              {candidate.has_disability && <Badge color="teal">PwD</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Party & Election */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
            Party & Election
          </h2>
          <dl className="space-y-3">
            <InfoRow label="Party (Nepali)" value={candidate.party.name_ne} />
            <InfoRow label="Party (English)" value={candidate.party.name} />
            <InfoRow label="Election Symbol" value={candidate.election_symbol_name} />
            <InfoRow label="Election" value={candidate.election.name_ne} />
            {candidate.constituency && (
              <>
                <InfoRow
                  label="Constituency"
                  value={`${candidate.constituency.district.name} - ${candidate.constituency.number}`}
                />
                <InfoRow label="Province" value={candidate.constituency.district.province.name_ne} />
              </>
            )}
            <InfoRow label="Votes Received" value={candidate.votes_received.toLocaleString()} />
            {candidate.status && <InfoRow label="Status" value={candidate.status} />}
            {candidate.closed_list_rank && (
              <InfoRow label="PR Rank" value={candidate.closed_list_rank} />
            )}
          </dl>
        </Card>

        {/* Personal Info */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
            Personal Information
          </h2>
          <dl className="space-y-3">
            <InfoRow label="Father's Name" value={candidate.father_name} />
            <InfoRow label="Spouse's Name" value={candidate.spouse_name} />
            <InfoRow label="Address" value={candidate.address} />
            <InfoRow label="Citizenship Dist." value={candidate.citizenship_district} />
            <InfoRow label="Voter ID" value={candidate.voter_id} />
            {candidate.inclusion_group && (
              <InfoRow label="Inclusion Group" value={candidate.inclusion_group} />
            )}
          </dl>
        </Card>

        {/* Qualifications */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
            Qualifications & Experience
          </h2>
          <dl className="space-y-3">
            <InfoRow label="Qualification" value={candidate.qualification} />
            <InfoRow label="Institution" value={candidate.institution} />
            {candidate.experience && <InfoRow label="Experience" value={candidate.experience} />}
            {candidate.other_details && (
              <InfoRow label="Other Details" value={candidate.other_details} />
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
}
