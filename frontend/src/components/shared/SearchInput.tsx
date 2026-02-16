import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...' }: SearchInputProps) {
  const [input, setInput] = useState(value);
  const debouncedInput = useDebounce(input);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (debouncedInput !== value) {
      onChange(debouncedInput);
    }
    // Only fire when debouncedInput changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-surface-300 bg-white py-2 pl-10 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:placeholder:text-ink-500"
      />
    </div>
  );
}
