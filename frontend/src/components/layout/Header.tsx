import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useLang } from '@/contexts/language-context';
import { NavLink } from './NavLink';
import { MobileNav } from './MobileNav';

const links = [
  { to: '/', label: 'Home', labelNe: 'गृह' },
  { to: '/candidates', label: 'Candidates', labelNe: 'उम्मेदवार' },
  { to: '/parties', label: 'Parties', labelNe: 'दल' },
  { to: '/geography', label: 'Geography', labelNe: 'भूगोल' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang } = useLang();

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200 bg-white/80 backdrop-blur dark:border-surface-700 dark:bg-surface-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-nepali text-lg font-bold text-primary-600 dark:text-primary-400">
            निर्वाचन २०८२
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {lang === 'ne' ? link.labelNe : link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded p-2 text-ink-500 hover:bg-surface-200 dark:text-ink-400 dark:hover:bg-surface-800 md:hidden"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
