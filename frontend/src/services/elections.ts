import { apiGet } from '@/lib/api-client';
import type { CursorPage, ElectionListItem, ElectionDetail } from '@/types/api';

export function getElections(signal?: AbortSignal) {
  return apiGet<CursorPage<ElectionListItem>>('/elections/', undefined, signal);
}

export function getElection(id: number | string, signal?: AbortSignal) {
  return apiGet<ElectionDetail>(`/elections/${id}/`, undefined, signal);
}
