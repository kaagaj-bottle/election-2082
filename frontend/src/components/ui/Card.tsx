import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 ${className}`}
    >
      {children}
    </div>
  );
}
