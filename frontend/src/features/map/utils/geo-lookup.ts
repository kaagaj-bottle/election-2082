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
