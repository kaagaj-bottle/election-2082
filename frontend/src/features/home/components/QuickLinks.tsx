import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';

const links = [
  {
    to: '/candidates',
    title: 'Candidates',
    titleNe: 'उम्मेदवारहरू',
    description: 'Browse and search all election candidates',
    descriptionNe: 'निर्वाचन उम्मेदवारहरू खोज्नुहोस्',
  },
  {
    to: '/parties',
    title: 'Parties',
    titleNe: 'दलहरू',
    description: 'View all registered political parties',
    descriptionNe: 'सबै दर्ता भएका राजनीतिक दलहरू',
  },
  {
    to: '/geography',
    title: 'Geography',
    titleNe: 'भूगोल',
    description: 'Explore provinces, districts, and constituencies',
    descriptionNe: 'प्रदेश, जिल्ला र निर्वाचन क्षेत्र हेर्नुहोस्',
  },
];

export function QuickLinks() {
  const { lang } = useLang();
  const isNe = lang === 'ne';

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {links.map((link) => (
        <Link key={link.to} to={link.to}>
          <Card className="h-full transition-shadow hover:shadow-md">
            <h3
              className={`text-lg font-semibold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
            >
              {isNe ? link.titleNe : link.title}
            </h3>
            <p
              className={`text-sm font-medium text-primary-600 dark:text-primary-400 ${!isNe ? 'font-nepali' : ''}`}
            >
              {isNe ? link.title : link.titleNe}
            </p>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              {isNe ? link.descriptionNe : link.description}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
