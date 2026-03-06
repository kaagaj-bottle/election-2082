import { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/hooks/use-api';
import { getProvinces } from '@/services/provinces';
import { getProvince } from '@/services/provinces';
import { getDistrict } from '@/services/districts';
import { getConstituencyResults } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import type {
  CursorPage,
  Province,
  ProvinceDetail,
  DistrictDetail,
  CandidateListItem,
} from '@/types/api';

export function ConstituencyResults() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  const [provinceId, setProvinceId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [constituencyId, setConstituencyId] = useState('');

  const provinces = useApi<CursorPage<Province>>((signal) => getProvinces(signal), []);

  const provinceDetail = useApi<ProvinceDetail | null>(
    (signal) => {
      if (!provinceId) return Promise.resolve(null);
      return getProvince(provinceId, signal);
    },
    [provinceId],
  );

  const districtDetail = useApi<DistrictDetail | null>(
    (signal) => {
      if (!districtId) return Promise.resolve(null);
      return getDistrict(districtId, signal);
    },
    [districtId],
  );

  const results = useApi<CandidateListItem[] | null>(
    (signal) => {
      if (!constituencyId) return Promise.resolve(null);
      return getConstituencyResults(Number(constituencyId), signal);
    },
    [constituencyId],
  );

  // Reset cascading selects
  useEffect(() => {
    setDistrictId('');
    setConstituencyId('');
  }, [provinceId]);

  useEffect(() => {
    setConstituencyId('');
  }, [districtId]);

  // Auto-refresh results every 2 minutes
  const refreshResults = useCallback(() => {
    if (constituencyId) results.refetch();
  }, [constituencyId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!constituencyId) return;
    const id = setInterval(refreshResults, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [constituencyId, refreshResults]);

  const provinceOptions = (provinces.data?.results ?? []).map((p) => ({
    value: String(p.id),
    label: isNe ? p.name_ne : p.name,
  }));

  const districtOptions = (provinceDetail.data?.districts ?? []).map((d) => ({
    value: String(d.id),
    label: isNe ? d.name_ne : d.name,
  }));

  const constituencyOptions = (districtDetail.data?.constituencies ?? []).map((c) => ({
    value: String(c.id),
    label: `${isNe ? 'क्षेत्र' : 'Constituency'} ${c.number}`,
  }));

  const candidates = results.data;
  const topVotes = candidates?.[0]?.votes_received ?? 0;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-ink-800 dark:text-ink-100">
        {isNe ? 'क्षेत्रगत नतिजा' : 'Constituency Results'}
      </h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Select
          options={provinceOptions}
          placeholder={isNe ? '-- प्रदेश --' : '-- Province --'}
          value={provinceId}
          onChange={(e) => setProvinceId(e.target.value)}
        />
        <Select
          options={districtOptions}
          placeholder={isNe ? '-- जिल्ला --' : '-- District --'}
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
          disabled={!provinceId}
        />
        <Select
          options={constituencyOptions}
          placeholder={isNe ? '-- क्षेत्र --' : '-- Constituency --'}
          value={constituencyId}
          onChange={(e) => setConstituencyId(e.target.value)}
          disabled={!districtId}
        />
      </div>

      {results.isLoading && constituencyId && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {candidates && candidates.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="py-2 pr-3 text-left font-medium text-ink-500 dark:text-ink-400">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-ink-500 dark:text-ink-400">
                    {isNe ? 'उम्मेदवार' : 'Candidate'}
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-ink-500 dark:text-ink-400">
                    {isNe ? 'दल' : 'Party'}
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-ink-500 dark:text-ink-400">
                    {isNe ? 'मत' : 'Votes'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr
                    key={c.id}
                    className={`border-b border-surface-100 last:border-0 dark:border-surface-800 ${
                      i === 0 && topVotes > 0
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 pr-3 tabular-nums text-ink-500 dark:text-ink-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-ink-800 dark:text-ink-100">
                        {isNe ? c.name_ne : c.name}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-ink-600 dark:text-ink-300">
                      {isNe ? c.party.name_ne : c.party.name}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-semibold tabular-nums text-ink-800 dark:text-ink-100">
                        {c.votes_received.toLocaleString()}
                      </span>
                      {i === 0 && topVotes > 0 && (
                        <Badge color="green">
                          {isNe ? 'अग्रणी' : 'Leading'}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {candidates && candidates.length === 0 && (
        <p className="py-10 text-center text-sm text-ink-400">
          {isNe ? 'यस क्षेत्रको नतिजा उपलब्ध छैन।' : 'No results available for this constituency.'}
        </p>
      )}
    </div>
  );
}
