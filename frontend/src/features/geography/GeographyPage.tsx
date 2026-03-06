import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { getProvinces } from '@/services/provinces';
import { getProvince } from '@/services/provinces';
import { getDistrict } from '@/services/districts';
import { useLang } from '@/contexts/language-context';
import type {
  CursorPage,
  Province,
  ProvinceDetail,
  DistrictMinimal,
  DistrictDetail,
} from '@/types/api';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ProvinceList } from './components/ProvinceList';
import { DistrictList } from './components/DistrictList';
import { ConstituencyList } from './components/ConstituencyList';

export default function GeographyPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictMinimal | null>(null);

  const provinces = useApi<CursorPage<Province>>((signal) => getProvinces(signal), []);

  const provinceDetail = useApi<ProvinceDetail | null>(
    (signal) => {
      if (!selectedProvince) return Promise.resolve(null);
      return getProvince(selectedProvince.id, signal);
    },
    [selectedProvince?.id],
  );

  const districtDetail = useApi<DistrictDetail | null>(
    (signal) => {
      if (!selectedDistrict) return Promise.resolve(null);
      return getDistrict(selectedDistrict.id, signal);
    },
    [selectedDistrict?.id],
  );

  const handleProvinceSelect = (province: Province) => {
    setSelectedProvince(province);
    setSelectedDistrict(null);
  };

  const handleDistrictSelect = (district: DistrictMinimal) => {
    setSelectedDistrict(district);
  };

  const nameOf = (obj: { name: string; name_ne: string }) => (isNe ? obj.name_ne : obj.name);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">{isNe ? 'भूगोल' : 'Geography'}</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {isNe
            ? 'प्रदेश, जिल्ला र निर्वाचन क्षेत्र हेर्नुहोस्'
            : 'Explore provinces, districts, and constituencies'}
        </p>
      </div>

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 rounded-lg bg-surface-50 px-3 py-2 text-sm dark:bg-surface-800/50">
        <button
          onClick={() => {
            setSelectedProvince(null);
            setSelectedDistrict(null);
          }}
          className={`rounded px-2 py-1 ${
            !selectedProvince
              ? 'font-medium text-primary-600 dark:text-primary-400'
              : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200'
          }`}
        >
          {isNe ? 'प्रदेश' : 'Provinces'}
        </button>
        {selectedProvince && (
          <>
            <svg className="h-4 w-4 text-ink-400 dark:text-ink-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <button
              onClick={() => setSelectedDistrict(null)}
              className={`rounded px-2 py-1 ${isNe ? 'font-nepali' : ''} ${
                !selectedDistrict
                  ? 'font-medium text-primary-600 dark:text-primary-400'
                  : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200'
              }`}
            >
              {nameOf(selectedProvince)}
            </button>
          </>
        )}
        {selectedDistrict && (
          <>
            <svg className="h-4 w-4 text-ink-400 dark:text-ink-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span
              className={`rounded px-2 py-1 font-medium text-primary-600 dark:text-primary-400 ${isNe ? 'font-nepali' : ''}`}
            >
              {nameOf(selectedDistrict)}
            </span>
          </>
        )}
      </nav>

      {/* Content */}
      {!selectedProvince && (
        <>
          {provinces.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : provinces.error ? (
            <ErrorMessage message={provinces.error} onRetry={provinces.refetch} />
          ) : (
            <ProvinceList provinces={provinces.data?.results ?? []} onSelect={handleProvinceSelect} />
          )}
        </>
      )}

      {selectedProvince && !selectedDistrict && (
        <>
          {provinceDetail.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : provinceDetail.error ? (
            <ErrorMessage message={provinceDetail.error} onRetry={provinceDetail.refetch} />
          ) : (
            <DistrictList
              districts={provinceDetail.data?.districts ?? []}
              onSelect={handleDistrictSelect}
            />
          )}
        </>
      )}

      {selectedDistrict && (
        <>
          {districtDetail.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : districtDetail.error ? (
            <ErrorMessage message={districtDetail.error} onRetry={districtDetail.refetch} />
          ) : (
            <ConstituencyList
              constituencies={districtDetail.data?.constituencies ?? []}
              provinceId={selectedProvince?.id}
              districtId={selectedDistrict?.id}
            />
          )}
        </>
      )}
    </div>
  );
}
