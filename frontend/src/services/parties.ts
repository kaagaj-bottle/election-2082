import { apiGet, apiGetByUrl } from '@/lib/api-client';
import type { CursorPage, Party, PartyDetail } from '@/types/api';

export function getParties(signal?: AbortSignal) {
  return apiGet<CursorPage<Party>>('/parties/', undefined, signal);
}

export function getPartiesByUrl(url: string, signal?: AbortSignal) {
  return apiGetByUrl<CursorPage<Party>>(url, signal);
}

export function getParty(id: number | string, signal?: AbortSignal) {
  return apiGet<PartyDetail>(`/parties/${id}/`, undefined, signal);
}
