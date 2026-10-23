import type { ProvinceConstituencyResult } from '@/types/api';

interface ConstituencyTooltipProps {
  districtName: string;
  constituencyNumber: number;
  result: ProvinceConstituencyResult | undefined;
  isNe: boolean;
}

export function ConstituencyTooltipContent({
  districtName,
  constituencyNumber,
  result,
  isNe,
}: ConstituencyTooltipProps) {
  return (
    <div className="min-w-[180px]">
      <div className="font-semibold">{districtName}</div>
      <div className="text-xs text-gray-500">
        {isNe ? `क्षेत्र ${constituencyNumber}` : `Constituency ${constituencyNumber}`}
      </div>
      {result && result.top_candidates.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {result.top_candidates.slice(0, 3).map((cand, i) => (
            <div key={i} className="border-t border-gray-200 pt-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{isNe ? cand.name_ne : cand.name}</span>
                <span className="font-semibold tabular-nums">
                  {cand.votes_received.toLocaleString()}
                </span>
              </div>
              <div className="text-gray-500">
                {isNe ? cand.party.name_ne : cand.party.name}
                {cand.status === 'Elected' && (
                  <span className="ml-1 text-green-600">{isNe ? '(निर्वाचित)' : '(Elected)'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!result && (
        <div className="mt-1 text-xs text-gray-500">
          {isNe ? 'नतिजा उपलब्ध छैन' : 'No results available'}
        </div>
      )}
    </div>
  );
}
