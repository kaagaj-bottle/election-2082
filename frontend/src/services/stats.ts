import { apiGet } from '@/lib/api-client';
import type { ElectionStats } from '@/types/api';

export function getStats(signal?: AbortSignal) {
  return apiGet<ElectionStats>('/candidates/stats/', undefined, signal);
}
