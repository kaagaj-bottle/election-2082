import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:placeholder:text-ink-500 ${className}`}
        {...props}
      />
    </div>
  );
}
