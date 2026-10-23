import { apiGet } from '@/lib/api-client';
import type { DistrictDetail } from '@/types/api';


export function getDistrict(id: number | string, signal?: AbortSignal) {
  return apiGet<DistrictDetail>(`/districts/${id}/`, undefined, signal);
}
