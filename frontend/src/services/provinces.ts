import { apiGet } from '@/lib/api-client';
import type { CursorPage, Province, ProvinceDetail } from '@/types/api';

export function getProvinces(signal?: AbortSignal) {
  return apiGet<CursorPage<Province>>('/provinces/', undefined, signal);
}

export function getProvince(id: number | string, signal?: AbortSignal) {
  return apiGet<ProvinceDetail>(`/provinces/${id}/`, undefined, signal);
}
