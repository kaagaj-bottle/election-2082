import type { CandidateDetail } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useLang } from '@/contexts/language-context';

interface CandidateProfileProps {
  candidate: CandidateDetail;
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
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const n = (ne: string, en: string) => (isNe ? ne : en);
  const name = (obj: { name: string; name_ne: string }) => (isNe ? obj.name_ne : obj.name);
  const detail = (ne: string, en: string) => (isNe ? ne : en);

  const primary = isNe ? candidate.name_ne : candidate.name;
  const secondary = isNe ? candidate.name : candidate.name_ne;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex flex-col items-start gap-5 sm:flex-row">
          <Avatar src={candidate.photo_url} name={candidate.name_ne || candidate.name} size="lg" />
          <div className="flex-1">
            <h1
              className={`text-2xl font-bold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
            >
              {primary}
            </h1>
            {secondary && (
              <p
                className={`text-lg text-ink-500 dark:text-ink-400 ${!isNe ? 'font-nepali' : ''}`}
              >
                {secondary}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge color={genderColor[candidate.gender]}>
                {genderLabel[candidate.gender][lang]}
              </Badge>
              {candidate.age && (
                <Badge color="amber">
                  {isNe ? `उमेर ${candidate.age}` : `Age ${candidate.age}`}
                </Badge>
              )}
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
            {n('दल र निर्वाचन', 'Party & Election')}
          </h2>
          <dl className="space-y-3">
            <InfoRow label={n('दल', 'Party')} value={name(candidate.party)} />
            <InfoRow
              label={n('चुनाव चिन्ह', 'Election Symbol')}
              value={detail(candidate.election_symbol_name, candidate.election_symbol_name_en)}
            />
            <InfoRow label={n('निर्वाचन', 'Election')} value={name(candidate.election)} />
            {candidate.constituency && (
              <>
                <InfoRow
                  label={n('निर्वाचन क्षेत्र', 'Constituency')}
                  value={`${name(candidate.constituency.district)} - ${candidate.constituency.number}`}
                />
                <InfoRow
                  label={n('प्रदेश', 'Province')}
                  value={name(candidate.constituency.district.province)}
                />
              </>
            )}
            <InfoRow
              label={n('प्राप्त मत', 'Votes Received')}
              value={candidate.votes_received.toLocaleString()}
            />
            {candidate.status && (
              <InfoRow label={n('स्थिति', 'Status')} value={candidate.status} />
            )}
            {candidate.closed_list_rank && (
              <InfoRow label={n('PR क्रम', 'PR Rank')} value={candidate.closed_list_rank} />
            )}
          </dl>
        </Card>

        {/* Personal Info */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
            {n('व्यक्तिगत जानकारी', 'Personal Information')}
          </h2>
          <dl className="space-y-3">
            <InfoRow
              label={n('बुबाको नाम', "Father's Name")}
              value={detail(candidate.father_name, candidate.father_name_en)}
            />
            <InfoRow
              label={n('पति/पत्नीको नाम', "Spouse's Name")}
              value={detail(candidate.spouse_name, candidate.spouse_name_en)}
            />
            <InfoRow
              label={n('ठेगाना', 'Address')}
              value={detail(candidate.address, candidate.address_en)}
            />
            <InfoRow
              label={n('नागरिकता जिल्ला', 'Citizenship Dist.')}
              value={detail(candidate.citizenship_district, candidate.citizenship_district_en)}
            />
            <InfoRow label={n('मतदाता परिचयपत्र', 'Voter ID')} value={candidate.voter_id} />
            {(candidate.inclusion_group || candidate.inclusion_group_en) && (
              <InfoRow
                label={n('समावेशी समूह', 'Inclusion Group')}
                value={detail(candidate.inclusion_group, candidate.inclusion_group_en)}
              />
            )}
          </dl>
        </Card>

        {/* Qualifications */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
            {n('योग्यता र अनुभव', 'Qualifications & Experience')}
          </h2>
          <dl className="space-y-3">
            <InfoRow
              label={n('योग्यता', 'Qualification')}
              value={detail(candidate.qualification, candidate.qualification_en)}
            />
            <InfoRow
              label={n('संस्था', 'Institution')}
              value={detail(candidate.institution, candidate.institution_en)}
            />
            {(candidate.experience || candidate.experience_en) && (
              <InfoRow
                label={n('अनुभव', 'Experience')}
                value={detail(candidate.experience, candidate.experience_en)}
              />
            )}
            {(candidate.other_details || candidate.other_details_en) && (
              <InfoRow
                label={n('अन्य विवरण', 'Other Details')}
                value={detail(candidate.other_details, candidate.other_details_en)}
              />
            )}
          </dl>
        </Card>
      </div>
    </div>
  );
}
