import { useMemo, useCallback, useRef } from 'react';
import { MapContainer, GeoJSON, Pane } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';
import type { ProvinceConstituencyResult } from '@/types/api';
import {
  DISTRICT_BORDER_STYLE,
  DISTRICT_BORDER_STYLE_DARK,
  getPartyColor,
  CONSTITUENCY_HOVER_STYLE,
  CONSTITUENCY_SELECTED_STYLE,
} from '../utils/map-styles';
import { getConstituencyKey } from '../utils/geo-lookup';
import { MapLegend, buildLegendEntries } from './MapLegend';
import { ConstituencyTooltipContent } from './MapTooltip';
import { renderToString } from 'react-dom/server';
import type { Feature } from 'geojson';
import type { Layer, PathOptions, Map as LeafletMap } from 'leaflet';

// Nepal approximate bounds
const NEPAL_CENTER: [number, number] = [28.3, 84.1];
const NEPAL_ZOOM = 7;

interface NepalMapProps {
  districts: FeatureCollection | null;
  constituencies: FeatureCollection | null;
  resultsByConstituencyKey: Map<string, ProvinceConstituencyResult>;
  isDark: boolean;
  isNe: boolean;
  onSelectConstituency: (key: string, result: ProvinceConstituencyResult | null) => void;
  selectedConstituencyKey: string | null;
}

export function NepalMap({
  districts,
  constituencies,
  resultsByConstituencyKey,
  isDark,
  isNe,
  onSelectConstituency,
  selectedConstituencyKey,
}: NepalMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  // Build legend entries from all constituency results
  const legendEntries = useMemo(() => {
    const partyCounts = new Map<string, number>();
    for (const [, result] of resultsByConstituencyKey) {
      const topParty = result.top_candidates[0]?.party;
      if (topParty) {
        const name = isNe ? topParty.name_ne : topParty.name;
        partyCounts.set(name, (partyCounts.get(name) ?? 0) + 1);
      }
    }
    return buildLegendEntries(partyCounts, isNe);
  }, [resultsByConstituencyKey, isNe]);

  const constituencyStyle = useCallback(
    (feature?: Feature): PathOptions => {
      if (!feature) return {};
      const key = getConstituencyKey(feature);
      const result = resultsByConstituencyKey.get(key);
      const isSelected = selectedConstituencyKey === key;

      if (isSelected) {
        const topParty = result?.top_candidates[0]?.party.name;
        return {
          ...CONSTITUENCY_SELECTED_STYLE,
          fillColor: topParty ? getPartyColor(topParty) : (isDark ? '#334155' : '#cbd5e1'),
        };
      }

      const topCandidate = result?.top_candidates[0];
      const fillColor = topCandidate
        ? getPartyColor(topCandidate.party.name)
        : isDark
          ? '#334155'
          : '#cbd5e1';

      return {
        weight: 1,
        color: isDark ? '#475569' : '#94a3b8',
        fillOpacity: topCandidate ? 0.4 : 0.15,
        fillColor,
      };
    },
    [resultsByConstituencyKey, isDark, selectedConstituencyKey],
  );

  const onEachConstituency = useCallback(
    (feature: Feature, layer: Layer) => {
      const key = getConstituencyKey(feature);
      const result = resultsByConstituencyKey.get(key);
      const p = feature.properties ?? {};
      const districtName = (p.DISTRICT as string) || '';
      const constNum = (p.F_CONST as number) || 0;

      const tooltipHtml = renderToString(
        <ConstituencyTooltipContent
          districtName={districtName}
          constituencyNumber={constNum}
          result={result}
          isNe={isNe}
        />,
      );
      layer.bindTooltip(tooltipHtml, { sticky: true, className: 'map-tooltip' });

      layer.on({
        mouseover: (e) => {
          const target = e.target as L.Path;
          if (key !== selectedConstituencyKey) {
            const topParty = result?.top_candidates[0]?.party.name;
            target.setStyle({
              ...CONSTITUENCY_HOVER_STYLE,
              fillColor: topParty ? getPartyColor(topParty) : undefined,
            });
            target.bringToFront();
          }
        },
        mouseout: (e) => {
          const target = e.target as L.Path;
          if (key !== selectedConstituencyKey) {
            target.setStyle(constituencyStyle(feature));
          }
        },
        click: () => {
          onSelectConstituency(key, result ?? null);
        },
      });
    },
    [resultsByConstituencyKey, isNe, selectedConstituencyKey, constituencyStyle, onSelectConstituency],
  );

  const bgColor = isDark ? '#0f172a' : '#f1f5f9'; // slate-950 / slate-100

  return (
    <div className="relative isolate">
      <MapContainer
        center={NEPAL_CENTER}
        zoom={NEPAL_ZOOM}
        minZoom={6}
        maxZoom={12}
        scrollWheelZoom={true}
        className="h-[400px] w-full rounded-lg sm:h-[500px] lg:h-[600px]"
        style={{ background: bgColor }}
        ref={mapRef}
        zoomControl={true}
        attributionControl={false}
      >
        {/* Constituency layer (interactive, bottom) */}
        {constituencies && (
          <GeoJSON
            key={`const-${isDark}-${selectedConstituencyKey}`}
            data={constituencies}
            style={constituencyStyle}
            onEachFeature={onEachConstituency}
          />
        )}

        {/* District borders — pointer-events: none so constituencies underneath are clickable */}
        <Pane name="district-borders" style={{ zIndex: 450, pointerEvents: 'none' }}>
          {districts && (
            <GeoJSON
              key={`dist-${isDark}`}
              data={districts}
              style={isDark ? DISTRICT_BORDER_STYLE_DARK : DISTRICT_BORDER_STYLE}
              interactive={false}
            />
          )}
        </Pane>

      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-1000">
        <MapLegend entries={legendEntries} isNe={isNe} />
      </div>
    </div>
  );
}
