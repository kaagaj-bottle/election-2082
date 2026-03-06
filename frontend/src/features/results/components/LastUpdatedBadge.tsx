import { useApi } from '@/hooks/use-api';
import { getLastUpdated } from '@/services/results';
import { useLang } from '@/contexts/language-context';
import type { LastUpdated } from '@/types/api';

export function LastUpdatedBadge() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const { data } = useApi<LastUpdated>((signal) => getLastUpdated(signal), []);

  if (!data?.last_updated) return null;

  const updatedAt = new Date(data.last_updated);
  const minutesAgo = Math.floor((Date.now() - updatedAt.getTime()) / 60000);

  let timeText: string;
  if (minutesAgo < 1) {
    timeText = isNe ? 'भर्खरै' : 'just now';
  } else if (minutesAgo < 60) {
    timeText = isNe ? `${minutesAgo} मिनेट अगाडि` : `${minutesAgo}m ago`;
  } else {
    const hours = Math.floor(minutesAgo / 60);
    timeText = isNe ? `${hours} घण्टा अगाडि` : `${hours}h ago`;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      {isNe ? 'अपडेट' : 'Updated'} {timeText}
    </div>
  );
}
