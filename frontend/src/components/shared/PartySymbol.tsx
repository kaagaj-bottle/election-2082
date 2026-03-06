const sizeMap = {
  xs: { container: 'h-5 w-5', icon: 'h-3 w-3' },
  sm: { container: 'h-6 w-6', icon: 'h-3 w-3' },
  md: { container: 'h-8 w-8', icon: 'h-4 w-4' },
  lg: { container: 'h-10 w-10', icon: 'h-5 w-5' },
  xl: { container: 'h-12 w-12', icon: 'h-6 w-6' },
} as const;

interface PartySymbolProps {
  symbolImage: string | null | undefined;
  size: keyof typeof sizeMap;
}

export function PartySymbol({ symbolImage, size }: PartySymbolProps) {
  const s = sizeMap[size];

  if (symbolImage) {
    return (
      <img
        src={`/party-symbols/${symbolImage}`}
        alt=""
        className={`${s.container} shrink-0 object-contain`}
      />
    );
  }

  return (
    <div
      className={`flex ${s.container} shrink-0 items-center justify-center rounded-md bg-ink-100 dark:bg-ink-700`}
    >
      <svg
        className={`${s.icon} text-ink-400 dark:text-ink-500`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </div>
  );
}
