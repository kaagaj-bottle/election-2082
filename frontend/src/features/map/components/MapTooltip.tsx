import type { ProvinceConstituencyResult } from '@/types/api';

interface MapTooltipProps {
  districtName: string;
  results: ProvinceConstituencyResult[];
  isNe: boolean;
}

export function MapTooltipContent({ districtName, results, isNe }: MapTooltipProps) {
  if (results.length === 0) {
    return (
      <div className="min-w-[160px]">
        <div className="font-semibold">{districtName}</div>
        <div className="text-xs text-gray-500">{isNe ? 'नतिजा उपलब्ध छैन' : 'No results available'}</div>
      </div>
    );
  }

  return (
    <div className="min-w-[200px]">
      <div className="mb-1 font-semibold">{districtName}</div>
      <div className="text-xs text-gray-500">
        {results.length} {isNe ? 'क्षेत्र' : results.length === 1 ? 'constituency' : 'constituencies'}
      </div>
      <div className="mt-1.5 space-y-1">
        {results.slice(0, 3).map((r) => {
          const top = r.top_candidates[0];
          if (!top) return null;
          return (
            <div key={r.constituency.id} className="border-t border-gray-200 pt-1 text-xs">
              <div className="font-medium">
                {isNe ? `क्षेत्र ${r.constituency.number}` : `Constituency ${r.constituency.number}`}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>{isNe ? top.name_ne : top.name}</span>
                <span className="font-semibold tabular-nums">
                  {top.votes_received.toLocaleString()}
                </span>
              </div>
              <div className="text-gray-500">
                {isNe ? top.party.name_ne : top.party.name}
                {top.status === 'Elected' && (
                  <span className="ml-1 text-green-600">{isNe ? '(निर्वाचित)' : '(Elected)'}</span>
                )}
              </div>
            </div>
          );
        })}
        {results.length > 3 && (
          <div className="text-xs text-gray-400">
            +{results.length - 3} {isNe ? 'थप' : 'more'}
          </div>
        )}
      </div>
    </div>
  );
}

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
