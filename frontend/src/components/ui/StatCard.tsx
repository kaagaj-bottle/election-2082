import type { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-800/30 dark:text-primary-300">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm text-ink-500 dark:text-ink-400">{label}</p>
        <p className="text-2xl font-semibold text-ink-800 dark:text-ink-100">{value}</p>
      </div>
    </Card>
  );
}
