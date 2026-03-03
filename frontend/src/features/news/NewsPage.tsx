import { useEffect, useState } from 'react';
import { useLang } from '@/contexts/language-context';
import { useApi } from '@/hooks/use-api';
import { getNews } from '@/services/news';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Badge } from '@/components/ui/Badge';
import type { NewsArticle } from '@/types/api';

const SOURCE_COLORS: Record<string, 'blue' | 'indigo' | 'violet' | 'rose' | 'amber' | 'green' | 'teal' | 'gray'> = {
  OnlineKhabar: 'blue',
  'OnlineKhabar English': 'indigo',
  Setopati: 'violet',
  'Nagarik News': 'teal',
  'Kathmandu Post': 'rose',
};

function formatDate(isoDate: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang === 'ne' ? 'ne-NP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function ArticleCard({ article, lang }: { article: NewsArticle; lang: string }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-lg border border-surface-200 bg-white transition-shadow hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
    >
      {article.image_url && (
        <div className="aspect-video w-full overflow-hidden bg-surface-100 dark:bg-surface-800">
          <img
            src={article.image_url}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2">
          <Badge color={SOURCE_COLORS[article.source] ?? 'gray'}>{article.source}</Badge>
          {article.published && (
            <span className="text-xs text-ink-400 dark:text-ink-500">
              {formatDate(article.published, lang)}
            </span>
          )}
        </div>
        <h3 className="mb-2 font-nepali text-base font-semibold leading-snug text-ink-800 group-hover:text-primary-600 dark:text-ink-100 dark:group-hover:text-primary-400">
          {article.title}
        </h3>
        {article.summary && (
          <p className="line-clamp-3 text-sm text-ink-500 dark:text-ink-400">{article.summary}</p>
        )}
      </div>
    </a>
  );
}

const SOURCES = [
  'OnlineKhabar',
  'OnlineKhabar English',
  'Setopati',
  'Nagarik News',
  'Kathmandu Post',
] as const;

const FILTER_BG: Record<string, string> = {
  OnlineKhabar: 'bg-blue-600 text-white',
  'OnlineKhabar English': 'bg-indigo-600 text-white',
  Setopati: 'bg-violet-600 text-white',
  'Nagarik News': 'bg-teal-600 text-white',
  'Kathmandu Post': 'bg-rose-600 text-white',
};

const FILTER_BORDER: Record<string, string> = {
  OnlineKhabar: 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950',
  'OnlineKhabar English': 'border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950',
  Setopati: 'border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950',
  'Nagarik News': 'border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-950',
  'Kathmandu Post': 'border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950',
};

export default function NewsPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useApi(
    (signal) => getNews(signal),
    [],
  );

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(refetch, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refetch]);

  const filtered = activeSource ? data?.filter((a) => a.source === activeSource) : data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nepali text-2xl font-bold text-ink-800 dark:text-ink-100">
          {isNe ? 'ताजा समाचार' : 'Imminent News'}
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {isNe
            ? 'निर्वाचन सम्बन्धी ताजा समाचार विभिन्न स्रोतहरूबाट'
            : 'Latest election news aggregated from multiple sources'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSource(null)}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            activeSource === null
              ? 'border-transparent bg-ink-800 text-white dark:bg-ink-100 dark:text-ink-900'
              : 'border-ink-300 text-ink-600 hover:bg-ink-50 dark:border-ink-600 dark:text-ink-300 dark:hover:bg-ink-800'
          }`}
        >
          {isNe ? 'सबै' : 'All'}
        </button>
        {SOURCES.map((source) => (
          <button
            key={source}
            onClick={() => setActiveSource(activeSource === source ? null : source)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeSource === source
                ? `border-transparent ${FILTER_BG[source]}`
                : `${FILTER_BORDER[source]}`
            }`}
          >
            {source}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={refetch} />}

      {!isLoading && !error && filtered && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-medium text-ink-700 dark:text-ink-200">
            {isNe ? 'कुनै समाचार भेटिएन' : 'No news articles found'}
          </h3>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            {isNe
              ? 'पछि फेरि प्रयास गर्नुहोस्'
              : 'Check back later for election-related news'}
          </p>
        </div>
      )}

      {!isLoading && !error && filtered && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, i) => (
            <ArticleCard key={`${article.link}-${i}`} article={article} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
