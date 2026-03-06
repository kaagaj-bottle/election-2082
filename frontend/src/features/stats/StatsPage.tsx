import { useApi } from '@/hooks/use-api';
import { getStats } from '@/services/stats';
import { useLang } from '@/contexts/language-context';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart } from '@/components/ui/BarChart';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { ElectionStats } from '@/types/api';

const fmt = (n: number) => n.toLocaleString();

const GENDER_LABELS: Record<string, { en: string; ne: string }> = {
  male: { en: 'Male', ne: 'पुरुष' },
  female: { en: 'Female', ne: 'महिला' },
  other: { en: 'Other', ne: 'अन्य' },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-ink-800 dark:text-ink-100">{children}</h2>
  );
}

function OverviewSection({ data, isNe }: { data: ElectionStats['overview']; isNe: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatCard label={isNe ? 'कुल उम्मेदवार' : 'Total Candidates'} value={fmt(data.total_candidates)} />
      <StatCard label={isNe ? 'राजनीतिक दल' : 'Parties'} value={fmt(data.total_parties)} />
      <StatCard label={isNe ? 'निर्वाचन क्षेत्र' : 'Constituencies'} value={fmt(data.total_constituencies)} />
    </div>
  );
}

function GenderSection({ data, isNe }: { data: ElectionStats['gender']; isNe: boolean }) {
  const items = data.map((g) => ({
    label: isNe ? GENDER_LABELS[g.gender]?.ne ?? g.gender : GENDER_LABELS[g.gender]?.en ?? g.gender,
    value: g.count,
    percentage: g.percentage,
  }));

  return (
    <Card>
      <SectionTitle>{isNe ? 'लैङ्गिक वितरण' : 'Gender Distribution'}</SectionTitle>
      <div className="mt-4">
        <BarChart items={items} />
      </div>
    </Card>
  );
}

function AgeSection({ data, isNe }: { data: ElectionStats['age']; isNe: boolean }) {
  const items = data.buckets.map((b) => ({
    label: b.bucket,
    value: b.count,
  }));

  return (
    <Card>
      <SectionTitle>{isNe ? 'उमेर वितरण' : 'Age Distribution'}</SectionTitle>
      <div className="mt-4">
        <BarChart items={items} color="bg-pastel-amber" />
      </div>
      <div className="mt-4 flex flex-wrap gap-6 border-t border-surface-200 pt-4 text-sm dark:border-surface-700">
        <div>
          <span className="text-ink-500 dark:text-ink-400">{isNe ? 'औसत उमेर' : 'Avg Age'}:</span>{' '}
          <span className="font-medium text-ink-800 dark:text-ink-100">{data.avg_age ?? '—'}</span>
        </div>
        <div>
          <span className="text-ink-500 dark:text-ink-400">{isNe ? 'सबैभन्दा कम' : 'Youngest'}:</span>{' '}
          <span className="font-medium text-ink-800 dark:text-ink-100">{data.min_age ?? '—'}</span>
        </div>
        <div>
          <span className="text-ink-500 dark:text-ink-400">{isNe ? 'सबैभन्दा धेरै' : 'Oldest'}:</span>{' '}
          <span className="font-medium text-ink-800 dark:text-ink-100">{data.max_age ?? '—'}</span>
        </div>
      </div>
    </Card>
  );
}

function PartyCandidatesSection({ data, isNe }: { data: ElectionStats['party_by_candidates']; isNe: boolean }) {
  const items = data.map((p) => ({
    label: isNe ? p.party__name_ne : p.party__name || p.party__name_ne,
    value: p.candidate_count ?? 0,
  }));

  return (
    <Card>
      <SectionTitle>{isNe ? 'उम्मेदवार अनुसार शीर्ष दलहरू' : 'Top Parties by Candidates'}</SectionTitle>
      <div className="mt-4">
        <BarChart items={items} color="bg-pastel-indigo" />
      </div>
    </Card>
  );
}

function ProvinceSection({ data, isNe }: { data: ElectionStats['provinces']; isNe: boolean }) {
  const items = data.map((p) => ({
    label: isNe ? p.name_ne : p.name || p.name_ne,
    value: p.candidate_count,
  }));

  return (
    <Card>
      <SectionTitle>{isNe ? 'प्रदेश अनुसार उम्मेदवार' : 'Candidates by Province'}</SectionTitle>
      <div className="mt-4">
        <BarChart items={items} color="bg-pastel-violet" />
      </div>
    </Card>
  );
}

function ConstituencySection({
  data,
  isNe,
}: {
  data: ElectionStats['candidates_per_constituency'];
  isNe: boolean;
}) {
  return (
    <Card>
      <SectionTitle>{isNe ? 'प्रति क्षेत्र उम्मेदवार' : 'Candidates per Constituency'}</SectionTitle>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-ink-500 dark:text-ink-400">{isNe ? 'औसत' : 'Average'}</p>
          <p className="text-4xl font-bold text-primary-500">{data.avg ?? '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-ink-500 dark:text-ink-400">{isNe ? 'न्यूनतम' : 'Min'}</p>
          <p className="text-4xl font-bold text-pastel-green">{data.min ?? '—'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-ink-500 dark:text-ink-400">{isNe ? 'अधिकतम' : 'Max'}</p>
          <p className="text-4xl font-bold text-pastel-rose">{data.max ?? '—'}</p>
        </div>
      </div>
    </Card>
  );
}

export default function StatsPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const { data, isLoading, error, refetch } = useApi<ElectionStats>(
    (signal) => getStats(signal),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refetch} />;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">
          {isNe ? 'तथ्याङ्क' : 'Statistics'}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {isNe
            ? 'निर्वाचन २०८२ — FPTP उम्मेदवार तथ्याङ्क'
            : 'Election 2082 — FPTP candidacy statistics'}
        </p>
      </div>

      <OverviewSection data={data.overview} isNe={isNe} />

      <div className="grid gap-6 lg:grid-cols-2">
        <GenderSection data={data.gender} isNe={isNe} />
        <AgeSection data={data.age} isNe={isNe} />
      </div>

      <PartyCandidatesSection data={data.party_by_candidates} isNe={isNe} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProvinceSection data={data.provinces} isNe={isNe} />
        <ConstituencySection data={data.candidates_per_constituency} isNe={isNe} />
      </div>
    </div>
  );
}
