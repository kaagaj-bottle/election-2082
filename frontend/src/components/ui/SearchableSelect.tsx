import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SearchableSelect({
  label,
  options,
  placeholder,
  value,
  onChange,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? '',
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIndex(-1);
  }, [filtered.length]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setQuery('');
    },
    [onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        setHighlightIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) {
        setHighlightIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const highlighted = open ? filtered[highlightIndex] : undefined;
      if (highlighted) {
        select(highlighted.value);
      } else if (!open) {
        setOpen(true);
      }
    }
  }

  const inputClasses =
    'w-full rounded border border-surface-300 bg-white pl-3 pr-8 py-2 text-sm text-ink-800 placeholder:text-ink-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-900 dark:text-ink-100 dark:placeholder:text-ink-500';
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-sm font-medium text-ink-600 dark:text-ink-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`${inputClasses} ${disabled ? disabledClasses : ''}`}
          placeholder={value ? selectedLabel : placeholder}
          value={open ? query : value ? selectedLabel : ''}
          readOnly={!open}
          disabled={disabled}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery('');
            }
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Clear button or chevron */}
        {value ? (
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                onChange('');
                setQuery('');
                setOpen(false);
              }
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        )}
      </div>
      {open && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-surface-300 bg-white py-1 text-sm shadow-lg dark:border-surface-700 dark:bg-surface-900"
        >
          {placeholder && (
            <li
              className={`cursor-pointer px-3 py-2 text-ink-400 hover:bg-primary-50 dark:text-ink-500 dark:hover:bg-surface-800 ${highlightIndex === -1 && !query ? 'bg-primary-50 dark:bg-surface-800' : ''}`}
              onMouseDown={() => select('')}
            >
              {placeholder}
            </li>
          )}
          {filtered.map((opt, i) => (
            <li
              key={opt.value}
              className={`cursor-pointer px-3 py-2 text-ink-800 dark:text-ink-100 ${
                i === highlightIndex
                  ? 'bg-primary-100 dark:bg-surface-700'
                  : opt.value === value
                    ? 'bg-primary-50 dark:bg-surface-800'
                    : 'hover:bg-primary-50 dark:hover:bg-surface-800'
              }`}
              onMouseDown={() => select(opt.value)}
            >
              {opt.label}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-ink-400 dark:text-ink-500">
              No matches
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
