import { useLang } from '@/contexts/language-context';

export function Footer() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <footer className="border-t border-surface-200 dark:border-surface-700">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-ink-500 dark:text-ink-400">
        {isNe
          ? 'नेपाल निर्वाचन २०८२ डाटा ब्राउजर · स्रोत: निर्वाचन आयोग नेपाल'
          : 'Nepal Election 2082 Data Browser · Data sourced from Election Commission of Nepal'}
      </div>
    </footer>
  );
}
