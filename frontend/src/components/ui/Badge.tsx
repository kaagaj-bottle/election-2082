import type { ReactNode } from 'react';

type BadgeColor = 'blue' | 'indigo' | 'violet' | 'rose' | 'amber' | 'green' | 'teal' | 'gray';

interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
}

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-pastel-blue/20 text-primary-700 dark:bg-pastel-blue/10 dark:text-pastel-blue',
  indigo: 'bg-pastel-indigo/20 text-purple-700 dark:bg-pastel-indigo/10 dark:text-pastel-indigo',
  violet: 'bg-pastel-violet/20 text-violet-700 dark:bg-pastel-violet/10 dark:text-pastel-violet',
  rose: 'bg-pastel-rose/20 text-rose-700 dark:bg-pastel-rose/10 dark:text-pastel-rose',
  amber: 'bg-pastel-amber/20 text-amber-700 dark:bg-pastel-amber/10 dark:text-pastel-amber',
  green: 'bg-pastel-green/20 text-green-700 dark:bg-pastel-green/10 dark:text-pastel-green',
  teal: 'bg-pastel-teal/20 text-teal-700 dark:bg-pastel-teal/10 dark:text-pastel-teal',
  gray: 'bg-surface-200 text-ink-600 dark:bg-surface-700 dark:text-ink-300',
};

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  );
}
