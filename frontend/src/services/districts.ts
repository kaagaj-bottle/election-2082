import { apiGet } from '@/lib/api-client';
import type { CursorPage, District, DistrictDetail } from '@/types/api';

export function getDistricts(signal?: AbortSignal) {
  return apiGet<CursorPage<District>>('/districts/', undefined, signal);
}

export function getDistrict(id: number | string, signal?: AbortSignal) {
  return apiGet<DistrictDetail>(`/districts/${id}/`, undefined, signal);
}
