import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { getProvinces } from '@/services/provinces';
import { getProvince } from '@/services/provinces';
import { getDistrict } from '@/services/districts';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">भूगोल</h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Explore provinces, districts, and constituencies
        </p>
      </div>

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-sm">
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
          Provinces
        </button>
        {selectedProvince && (
          <>
            <span className="text-ink-400">/</span>
            <button
              onClick={() => setSelectedDistrict(null)}
              className={`rounded px-2 py-1 font-nepali ${
                !selectedDistrict
                  ? 'font-medium text-primary-600 dark:text-primary-400'
                  : 'text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200'
              }`}
            >
              {selectedProvince.name_ne}
            </button>
          </>
        )}
        {selectedDistrict && (
          <>
            <span className="text-ink-400">/</span>
            <span className="rounded px-2 py-1 font-nepali font-medium text-primary-600 dark:text-primary-400">
              {selectedDistrict.name_ne}
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
            <ConstituencyList constituencies={districtDetail.data?.constituencies ?? []} />
          )}
        </>
      )}
    </div>
  );
}
