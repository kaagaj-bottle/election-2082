import { apiGet } from '@/lib/api-client';
import type { NewsArticle } from '@/types/api';

export function getNews(signal?: AbortSignal) {
  return apiGet<NewsArticle[]>('/news/', undefined, signal);
}
