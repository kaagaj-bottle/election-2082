interface BarChartItem {
  label: string;
  value: number;
  percentage?: number;
}

interface BarChartProps {
  items: BarChartItem[];
  color?: string;
  formatValue?: (n: number) => string;
}

const defaultFormat = (n: number) => n.toLocaleString();

export function BarChart({ items, color = 'bg-primary-500', formatValue = defaultFormat }: BarChartProps) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="group">
          <div className="mb-0.5 flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-ink-700 dark:text-ink-300">{item.label}</span>
            <span className="shrink-0 font-medium text-ink-800 dark:text-ink-100">
              {formatValue(item.value)}
              {item.percentage !== undefined && (
                <span className="ml-1 text-xs text-ink-400 dark:text-ink-500">
                  ({item.percentage}%)
                </span>
              )}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
            <div
              className={`h-full rounded-full transition-all ${color}`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
