import { Link } from 'react-router-dom';
import type { Party, PartyTally } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';
import { PartySymbol } from '@/components/shared/PartySymbol';

interface PartyCardProps {
  party: Party;
  tally?: PartyTally;
}

export function PartyCard({ party, tally }: PartyCardProps) {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const primary = isNe ? party.name_ne : party.name;
  const secondary = isNe ? party.name : party.name_ne;

  return (
    <Link to={`/candidates?party=${party.id}`} className="group">
      <Card className="transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <PartySymbol symbolImage={party.symbol_image} size="xl" />
          <div className="min-w-0 flex-1">

            <h3
              className={`text-base font-semibold text-ink-800 dark:text-ink-100 ${isNe ? 'font-nepali' : ''}`}
            >
              {primary}
            </h3>
            {secondary && (
              <p
                className={`mt-1 text-sm text-ink-500 dark:text-ink-400 ${!isNe ? 'font-nepali' : ''}`}
              >
                {secondary}
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {tally && (
                <>
                  <span className="text-green-600 dark:text-green-400">{isNe ? 'जित' : 'Won'}: {tally.seats_won}</span>
                  <span className="text-amber-600 dark:text-amber-400">{isNe ? 'अग्रणी' : 'Leading'}: {tally.seats_leading}</span>
                </>
              )}
              {party.pr_votes_received > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {isNe ? 'समानुपातिक मत' : 'PR'}: {party.pr_votes_received.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <svg
            className="h-5 w-5 flex-shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 dark:text-ink-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}
