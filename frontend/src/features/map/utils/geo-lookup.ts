import type { ProvinceConstituencyResult } from '@/types/api';
import type { Feature } from 'geojson';

// GeoJSON district name → API district name (for known mismatches)
const DISTRICT_NAME_MAP: Record<string, string> = {
  chitawan: 'chitwan',
  kabhrepalanchok: 'kavrepalanchok',
  kapilbastu: 'kapilvastu',
  makawanpur: 'makwanpur',
  tanahu: 'tanahun',
};

// ECN constituency GeoJSON DISTRICT names → API district names (additional mismatches)
const ECN_DISTRICT_NAME_MAP: Record<string, string> = {
  ...DISTRICT_NAME_MAP,
  nawalparasi_w: 'nawalparasi west',
  'nawalparasi_w.': 'nawalparasi west',
  nawalparasi_e: 'nawalparasi east',
  'nawalparasi_e.': 'nawalparasi east',
  rukum_w: 'rukum west',
  'rukum_w.': 'rukum west',
  rukum_e: 'rukum east',
  'rukum_e.': 'rukum east',
};

/**
 * Extract district name from a GeoJSON feature's properties.
 * Uses the nepal-districts-new.geojson format (DIST_EN) as primary.
 */
export function getDistrictName(feature: Feature): string {
  const p = feature.properties ?? {};
  return (p.DIST_EN || p.DISTRICT || p.district || p.District || p.name || '').trim();
}

/**
 * Normalize a district name to match API naming conventions.
 */
export function normalizeDistrictName(name: string): string {
  const lower = name.toLowerCase().trim();
  return DISTRICT_NAME_MAP[lower] ?? lower;
}

/**
 * Normalize ECN constituency district names to match API naming conventions.
 */
function normalizeEcnDistrictName(name: string): string {
  const lower = name.toLowerCase().trim();
  return ECN_DISTRICT_NAME_MAP[lower] ?? lower;
}

/**
 * Extract constituency key from a constituency GeoJSON feature.
 * Returns "{normalized_district_name}-{constituency_number}" for matching with API results.
 */
export function getConstituencyKey(feature: Feature): string {
  const p = feature.properties ?? {};
  const distName = normalizeEcnDistrictName((p.DISTRICT as string) || '');
  const constNum = p.F_CONST as number;
  return `${distName}-${constNum}`;
}

/**
 * Match district-level GeoJSON features to constituency results.
 */
export function matchDistrictResults(
  districtName: string,
  allResults: ProvinceConstituencyResult[],
): ProvinceConstituencyResult[] {
  const normalized = normalizeDistrictName(districtName);
  return allResults.filter((r) => {
    const distName = r.constituency.district.name.toLowerCase().trim();
    return distName === normalized;
  });
}
