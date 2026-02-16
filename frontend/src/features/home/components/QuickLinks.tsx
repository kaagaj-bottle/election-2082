import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

const links = [
  {
    to: '/candidates',
    title: 'Candidates',
    titleNe: 'उम्मेदवारहरू',
    description: 'Browse and search all election candidates',
  },
  {
    to: '/parties',
    title: 'Parties',
    titleNe: 'दलहरू',
    description: 'View all registered political parties',
  },
  {
    to: '/geography',
    title: 'Geography',
    titleNe: 'भूगोल',
    description: 'Explore provinces, districts, and constituencies',
  },
];

export function QuickLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {links.map((link) => (
        <Link key={link.to} to={link.to}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <h3 className="font-nepali text-lg font-semibold text-ink-800 dark:text-ink-100">
              {link.titleNe}
            </h3>
            <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{link.title}</p>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">{link.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
