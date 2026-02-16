import { useCallback, useEffect, useState } from 'react';

export type Language = 'ne' | 'en';

const STORAGE_KEY = 'lang';

function getInitialLang(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ne') return stored;
  return 'ne';
}

export function useLanguage() {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'ne' ? 'en' : 'ne');
  }, [lang, setLang]);

  useEffect(() => {
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';
  }, [lang]);

  return { lang, setLang, toggle };
}
