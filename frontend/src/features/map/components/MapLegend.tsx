import { getPartyColor } from '../utils/map-styles';

interface LegendEntry {
  party: string;
  color: string;
  count: number;
}

interface MapLegendProps {
  entries: LegendEntry[];
  isNe: boolean;
}

export function MapLegend({ entries, isNe }: MapLegendProps) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-surface-200 bg-white/95 p-3 shadow-md backdrop-blur dark:border-surface-700 dark:bg-surface-900/95">
      <div className="mb-2 text-xs font-semibold text-ink-600 dark:text-ink-300">
        {isNe ? 'अग्रणी दल' : 'Leading Party'}
      </div>
      <div className="space-y-1">
        {entries.map((e) => (
          <div key={e.party} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: e.color }}
            />
            <span className="text-ink-700 dark:text-ink-300">{e.party}</span>
            <span className="ml-auto tabular-nums text-ink-500 dark:text-ink-400">{e.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildLegendEntries(
  partyWinCounts: Map<string, number>,
  _isNe: boolean,
): LegendEntry[] {
  return Array.from(partyWinCounts.entries())
    .map(([party, count]) => ({
      party,
      color: getPartyColor(party),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
