import { createContext, useContext, type ReactNode } from 'react';
import { useLanguage, type Language } from '@/hooks/use-language';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const value = useLanguage();
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
