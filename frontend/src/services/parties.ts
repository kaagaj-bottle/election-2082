import { apiGet, apiGetByUrl } from '@/lib/api-client';
import type { CursorPage, Party } from '@/types/api';

export function getParties(params?: Record<string, string | undefined>, signal?: AbortSignal) {
  return apiGet<CursorPage<Party>>('/parties/', { page_size: '200', ...params }, signal);
}

export function getPartiesByUrl(url: string, signal?: AbortSignal) {
  return apiGetByUrl<CursorPage<Party>>(url, signal);
}

