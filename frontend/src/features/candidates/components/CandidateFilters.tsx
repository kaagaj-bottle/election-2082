import { useEffect, useMemo } from 'react';
import { Select } from '@/components/ui/Select';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/use-api';
import { getProvinces } from '@/services/provinces';
import { getProvince } from '@/services/provinces';
import { getDistrict } from '@/services/districts';
import { getParties } from '@/services/parties';
import { useLang } from '@/contexts/language-context';
import type { CursorPage, Province, ProvinceDetail, DistrictDetail, Party } from '@/types/api';

interface CandidateFiltersProps {
  filters: Record<string, string | undefined>;
  setFilter: (key: string, value: string | undefined) => void;
  clearFilters: () => void;
}

export function CandidateFilters({ filters, setFilter, clearFilters }: CandidateFiltersProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const provinces = useApi<CursorPage<Province>>(
    (signal) => getProvinces(signal),
    [],
  );

  const selectedProvinceId = filters.province;
  const provinceDetail = useApi<ProvinceDetail | null>(
    (signal) => {
      if (!selectedProvinceId) return Promise.resolve(null);
      return getProvince(selectedProvinceId, signal);
    },
    [selectedProvinceId],
  );

  const selectedDistrictId = filters.district;
  const districtDetail = useApi<DistrictDetail | null>(
    (signal) => {
      if (!selectedDistrictId) return Promise.resolve(null);
      return getDistrict(selectedDistrictId, signal);
    },
    [selectedDistrictId],
  );

  const parties = useApi<CursorPage<Party>>(
    (signal) => getParties(signal),
    [],
  );

  // Clear district + constituency when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setFilter('district', undefined);
      setFilter('constituency', undefined);
    }
  }, [selectedProvinceId, setFilter]);

  // Clear constituency when district changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setFilter('constituency', undefined);
    }
  }, [selectedDistrictId, setFilter]);

  const provinceOptions = useMemo(
    () =>
      (provinces.data?.results ?? []).map((p) => ({
        value: String(p.id),
        label: isNe ? p.name_ne : p.name,
      })),
    [provinces.data, isNe],
  );

  const districtOptions = useMemo(
    () =>
      (provinceDetail.data?.districts ?? []).map((d) => ({
        value: String(d.id),
        label: isNe ? d.name_ne : d.name,
      })),
    [provinceDetail.data, isNe],
  );

  const constituencyOptions = useMemo(
    () =>
      (districtDetail.data?.constituencies ?? []).map((c) => ({
        value: String(c.id),
        label: isNe ? `क्षेत्र ${c.number}` : `Constituency ${c.number}`,
      })),
    [districtDetail.data, isNe],
  );

  const partyOptions = useMemo(
    () =>
      (parties.data?.results ?? []).map((p) => ({
        value: String(p.id),
        label: isNe ? p.name_ne : p.name,
      })),
    [parties.data, isNe],
  );

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Select
          label={isNe ? 'प्रदेश' : 'Province'}
          options={provinceOptions}
          placeholder={isNe ? 'सबै प्रदेश' : 'All Provinces'}
          value={filters.province ?? ''}
          onChange={(e) => setFilter('province', e.target.value || undefined)}
        />
        <SearchableSelect
          label={isNe ? 'जिल्ला' : 'District'}
          options={districtOptions}
          placeholder={isNe ? 'सबै जिल्ला' : 'All Districts'}
          value={filters.district ?? ''}
          onChange={(val) => setFilter('district', val || undefined)}
          disabled={!selectedProvinceId}
        />
        <Select
          label={isNe ? 'निर्वाचन क्षेत्र' : 'Constituency'}
          options={constituencyOptions}
          placeholder={isNe ? 'सबै क्षेत्र' : 'All Constituencies'}
          value={filters.constituency ?? ''}
          onChange={(e) => setFilter('constituency', e.target.value || undefined)}
          disabled={!selectedDistrictId}
        />
        <SearchableSelect
          label={isNe ? 'दल' : 'Party'}
          options={partyOptions}
          placeholder={isNe ? 'सबै दल' : 'All Parties'}
          value={filters.party ?? ''}
          onChange={(val) => setFilter('party', val || undefined)}
        />
        <Select
          label={isNe ? 'लिङ्ग' : 'Gender'}
          options={[
            { value: 'male', label: isNe ? 'पुरुष' : 'Male' },
            { value: 'female', label: isNe ? 'महिला' : 'Female' },
            { value: 'other', label: isNe ? 'अन्य' : 'Other' },
          ]}
          placeholder={isNe ? 'सबै लिङ्ग' : 'All Genders'}
          value={filters.gender ?? ''}
          onChange={(e) => setFilter('gender', e.target.value || undefined)}
        />
        <Select
          label={isNe ? 'निर्वाचन प्रकार' : 'Election Type'}
          options={[
            { value: 'fptp', label: 'FPTP' },
            { value: 'pr', label: 'PR' },
          ]}
          placeholder={isNe ? 'सबै प्रकार' : 'All Types'}
          value={filters.election_type ?? ''}
          onChange={(e) => setFilter('election_type', e.target.value || undefined)}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300">
            {isNe ? 'उमेर' : 'Age Range'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={999}
              placeholder={isNe ? 'न्यूनतम' : 'Min'}
              value={filters.age_min ?? ''}
              onChange={(e) => setFilter('age_min', e.target.value || undefined)}
              className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:placeholder:text-ink-500"
            />
            <input
              type="number"
              min={0}
              max={999}
              placeholder={isNe ? 'अधिकतम' : 'Max'}
              value={filters.age_max ?? ''}
              onChange={(e) => setFilter('age_max', e.target.value || undefined)}
              className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:placeholder:text-ink-500"
            />
          </div>
        </div>
        <Select
          label={isNe ? 'क्रमबद्ध' : 'Order By'}
          options={[
            { value: '-votes_received', label: isNe ? 'बढी मत' : 'Most Votes' },
            { value: 'votes_received', label: isNe ? 'कम मत' : 'Least Votes' },
            { value: 'name_ne', label: isNe ? 'नाम (अ-ज्ञ)' : 'Name (A-Z)' },
            { value: '-name_ne', label: isNe ? 'नाम (ज्ञ-अ)' : 'Name (Z-A)' },
            { value: 'age', label: isNe ? 'उमेर (कम)' : 'Age (Young)' },
            { value: '-age', label: isNe ? 'उमेर (बढी)' : 'Age (Old)' },
          ]}
          placeholder={isNe ? 'पूर्वनिर्धारित' : 'Default Order'}
          value={filters.ordering ?? ''}
          onChange={(e) => setFilter('ordering', e.target.value || undefined)}
        />
      </div>
      {hasActiveFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {isNe ? 'सबै फिल्टर हटाउनुहोस्' : 'Clear all filters'}
          </Button>
        </div>
      )}
    </div>
  );
}
