import type { PathOptions } from 'leaflet';

export const DISTRICT_STYLE: PathOptions = {
  weight: 2,
  color: '#64748b', // slate-500
  fillOpacity: 0,
  dashArray: '6 4',
};

// District as non-interactive border overlay (no fill, dashed)
export const DISTRICT_BORDER_STYLE: PathOptions = {
  weight: 1.5,
  color: '#64748b', // slate-500
  fillOpacity: 0,
  dashArray: '6 4',
};

export const DISTRICT_BORDER_STYLE_DARK: PathOptions = {
  weight: 1.5,
  color: '#94a3b8', // slate-400
  fillOpacity: 0,
  dashArray: '6 4',
};

export const CONSTITUENCY_STYLE: PathOptions = {
  weight: 1,
  color: '#94a3b8', // slate-400
  fillOpacity: 0.15,
  fillColor: '#cbd5e1', // slate-300
};

export const CONSTITUENCY_HOVER_STYLE: PathOptions = {
  weight: 3,
  color: '#0ea5e9', // sky-500
  fillOpacity: 0.35,
};

export const CONSTITUENCY_SELECTED_STYLE: PathOptions = {
  weight: 3,
  color: '#2563eb', // blue-600
  fillOpacity: 0.4,
};

// Dark mode variants
export const DISTRICT_STYLE_DARK: PathOptions = {
  ...DISTRICT_STYLE,
  color: '#94a3b8', // slate-400
};

export const CONSTITUENCY_STYLE_DARK: PathOptions = {
  ...CONSTITUENCY_STYLE,
  color: '#64748b', // slate-500
  fillColor: '#334155', // slate-700
};

// Map party names to colors for constituency fills
const PARTY_COLORS: Record<string, string> = {
  'Nepali Congress': '#e11d48', // rose-600
  'नेपाली काँग्रेस': '#e11d48',
  'CPN (UML)': '#dc2626', // red-600
  'नेकपा (एमाले)': '#dc2626',
  'CPN (Maoist Centre)': '#b91c1c', // red-700
  'नेकपा (माओवादी केन्द्र)': '#b91c1c',
  'Rastriya Swatantra Party': '#2563eb', // blue-600
  'राष्ट्रिय स्वतन्त्र पार्टी': '#2563eb',
  'RPP': '#f59e0b', // amber-500
  'राप्रपा': '#f59e0b',
  'Rastriya Prajatantra Party': '#f59e0b',
  'राष्ट्रिय प्रजातन्त्र पार्टी': '#f59e0b',
  'CPN (Unified Socialist)': '#7c3aed', // violet-600
  'नेकपा (एकीकृत समाजवादी)': '#7c3aed',
  'Janata Samajbadi Party': '#059669', // emerald-600
  'जनता समाजवादी पार्टी': '#059669',
  'Loktantrik Samajbadi Party': '#0d9488', // teal-600
  'लोकतान्त्रिक समाजवादी पार्टी': '#0d9488',
  'Janamat Party': '#ca8a04', // yellow-600
  'जनमत पार्टी': '#ca8a04',
  'Nagarik Unmukti Party': '#ea580c', // orange-600
  'नागरिक उन्मुक्ति पार्टी': '#ea580c',
  Independent: '#6b7280', // gray-500
  'स्वतन्त्र': '#6b7280',
};

const DEFAULT_PARTY_COLOR = '#6b7280'; // gray-500

export function getPartyColor(partyName: string): string {
  return PARTY_COLORS[partyName] ?? DEFAULT_PARTY_COLOR;
}
