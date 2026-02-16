import { useEffect } from 'react';
import { NavLink } from './NavLink';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const links = [
  { to: '/', label: 'Home' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/parties', label: 'Parties' },
  { to: '/geography', label: 'Geography' },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-6 shadow-lg dark:bg-surface-900">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-nepali text-lg font-semibold text-ink-800 dark:text-ink-100">
            निर्वाचन २०८२
          </span>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-500 hover:bg-surface-200 dark:hover:bg-surface-800"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={onClose}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
