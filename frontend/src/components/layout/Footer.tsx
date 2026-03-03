import { useLang } from '@/contexts/language-context';

export function Footer() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <footer className="border-t border-surface-200 dark:border-surface-700">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-ink-500 dark:text-ink-400">
        <p>
          {isNe
            ? 'नेपाल निर्वाचन २०८२ डाटा ब्राउजर · स्रोत: निर्वाचन आयोग नेपाल'
            : 'Nepal Election 2082 Data Browser · Data sourced from Election Commission of Nepal'}
        </p>
        <p className="mt-2">
          {isNe ? 'निर्माता: ' : 'Built by '}
          <a
            href="https://zishansiddique.com.np"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            Zishan Siddique
          </a>
          {' · '}
          <a
            href="https://zishansiddique.com.np"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            {isNe ? 'थप जान्नुहोस्' : 'Get to know me'}
          </a>
        </p>
      </div>
    </footer>
  );
}
