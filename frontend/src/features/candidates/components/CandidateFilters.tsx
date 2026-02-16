import { useEffect, useMemo } from 'react';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useApi } from '@/hooks/use-api';
import { getProvinces } from '@/services/provinces';
import { getProvince } from '@/services/provinces';
import { getParties } from '@/services/parties';
import type { CursorPage, Province, ProvinceDetail, Party } from '@/types/api';

interface CandidateFiltersProps {
  filters: Record<string, string | undefined>;
  setFilter: (key: string, value: string | undefined) => void;
  clearFilters: () => void;
}

export function CandidateFilters({ filters, setFilter, clearFilters }: CandidateFiltersProps) {
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

  const parties = useApi<CursorPage<Party>>(
    (signal) => getParties(signal),
    [],
  );

  // Clear district when province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setFilter('district', undefined);
    }
  }, [selectedProvinceId, setFilter]);

  const provinceOptions = useMemo(
    () =>
      (provinces.data?.results ?? []).map((p) => ({
        value: String(p.id),
        label: p.name_ne,
      })),
    [provinces.data],
  );

  const districtOptions = useMemo(
    () =>
      (provinceDetail.data?.districts ?? []).map((d) => ({
        value: String(d.id),
        label: d.name_ne,
      })),
    [provinceDetail.data],
  );

  const partyOptions = useMemo(
    () =>
      (parties.data?.results ?? []).map((p) => ({
        value: String(p.id),
        label: p.name_ne,
      })),
    [parties.data],
  );

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Select
          label="Province"
          options={provinceOptions}
          placeholder="All Provinces"
          value={filters.province ?? ''}
          onChange={(e) => setFilter('province', e.target.value || undefined)}
        />
        <Select
          label="District"
          options={districtOptions}
          placeholder="All Districts"
          value={filters.district ?? ''}
          onChange={(e) => setFilter('district', e.target.value || undefined)}
          disabled={!selectedProvinceId}
        />
        <Select
          label="Party"
          options={partyOptions}
          placeholder="All Parties"
          value={filters.party ?? ''}
          onChange={(e) => setFilter('party', e.target.value || undefined)}
        />
        <Select
          label="Gender"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]}
          placeholder="All Genders"
          value={filters.gender ?? ''}
          onChange={(e) => setFilter('gender', e.target.value || undefined)}
        />
        <Select
          label="Election Type"
          options={[
            { value: 'fptp', label: 'FPTP' },
            { value: 'pr', label: 'PR' },
          ]}
          placeholder="All Types"
          value={filters.election_type ?? ''}
          onChange={(e) => setFilter('election_type', e.target.value || undefined)}
        />
        <Select
          label="Order By"
          options={[
            { value: '-votes_received', label: 'Most Votes' },
            { value: 'votes_received', label: 'Least Votes' },
            { value: 'name_ne', label: 'Name (A-Z)' },
            { value: '-name_ne', label: 'Name (Z-A)' },
            { value: 'age', label: 'Age (Young)' },
            { value: '-age', label: 'Age (Old)' },
          ]}
          placeholder="Default Order"
          value={filters.ordering ?? ''}
          onChange={(e) => setFilter('ordering', e.target.value || undefined)}
        />
      </div>
      {hasActiveFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
