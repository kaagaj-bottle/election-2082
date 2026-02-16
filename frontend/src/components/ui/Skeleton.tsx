export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-200 dark:bg-surface-700 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
