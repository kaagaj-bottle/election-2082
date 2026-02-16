import { useLang } from '@/contexts/language-context';

export function LanguageToggle() {
  const { lang, toggle } = useLang();

  return (
    <button
      onClick={toggle}
      className="rounded px-2 py-1.5 text-sm font-semibold text-ink-500 hover:bg-surface-200 dark:text-ink-400 dark:hover:bg-surface-800"
      aria-label={`Language: ${lang === 'ne' ? 'Nepali' : 'English'}. Click to switch.`}
      title={lang === 'ne' ? 'Switch to English' : 'नेपालीमा हेर्नुहोस्'}
    >
      {lang === 'ne' ? 'EN' : 'ने'}
    </button>
  );
}
