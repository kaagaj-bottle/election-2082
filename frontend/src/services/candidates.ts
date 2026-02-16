import { apiGet, apiGetByUrl } from '@/lib/api-client';
import type { CursorPage, CandidateListItem, CandidateDetail } from '@/types/api';

export function getCandidates(
  params?: Record<string, string | undefined>,
  signal?: AbortSignal,
) {
  return apiGet<CursorPage<CandidateListItem>>('/candidates/', params, signal);
}

export function getCandidatesByUrl(url: string, signal?: AbortSignal) {
  return apiGetByUrl<CursorPage<CandidateListItem>>(url, signal);
}

export function getCandidate(id: number | string, signal?: AbortSignal) {
  return apiGet<CandidateDetail>(`/candidates/${id}/`, undefined, signal);
}
