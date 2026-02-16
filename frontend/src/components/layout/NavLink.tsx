import { NavLink as RouterNavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavLinkProps {
  to: string;
  children: ReactNode;
  onClick?: () => void;
}

export function NavLink({ to, children, onClick }: NavLinkProps) {
  return (
    <RouterNavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-800/30 dark:text-primary-300'
            : 'text-ink-600 hover:bg-surface-200 dark:text-ink-300 dark:hover:bg-surface-800'
        }`
      }
    >
      {children}
    </RouterNavLink>
  );
}
