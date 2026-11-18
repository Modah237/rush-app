'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { CAMEROON_CITIES, CAMEROON_OVERVIEW } from '@/lib/cameroon-geo';
import Icon from '@/components/shared/icon';

export type MapMarkerVariant = 'shop' | 'customer' | 'rider' | 'pickup' | 'dropoff' | 'city' | 'zone';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  badge?: string;
  variant: MapMarkerVariant;
  pulse?: boolean;
}

export interface MapRoute {
  id: string;
  points: [number, number][];
  color?: string;
  dashed?: boolean;
  weight?: number;
}

export interface MapCircle {
  id: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  color?: string;
  label?: string;
}

export interface CameroonMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  circles?: MapCircle[];
  heightClassName?: string;
  showCitySwitcher?: boolean;
  showLocateButton?: boolean;
  fitMarkers?: boolean;
  interactiveHint?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onCitySelect?: (cityId: string) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMarkerHtml(marker: MapMarker): string {
  const palette: Record<MapMarkerVariant, { bg: string; border: string; text: string; glyph: string }> = {
    shop: { bg: '#1A1413', border: '#FFFFFF', text: '#FFFFFF', glyph: '🏪' },
    customer: { bg: '#F50012', border: '#FFFFFF', text: '#FFFFFF', glyph: '📍' },
    rider: { bg: '#15A05A', border: '#FFFFFF', text: '#FFFFFF', glyph: '🏍️' },
    pickup: { bg: '#2563EB', border: '#FFFFFF', text: '#FFFFFF', glyph: 'A' },
    dropoff: { bg: '#F50012', border: '#FFFFFF', text: '#FFFFFF', glyph: 'B' },
    city: { bg: '#1A1413', border: '#F50012', text: '#FFFFFF', glyph: '🇨🇲' },
    zone: { bg: '#FFFFFF', border: '#F50012', text: '#1A1413', glyph: '•' },
  };

  const style = palette[marker.variant];

  if (marker.variant === 'city') {
    return `
      <div style="display:flex;align-items:center;gap:5px;background:${style.bg};color:${style.text};border:2px solid ${style.border};padding:4px 9px;border-radius:999px;font-weight:900;font-size:11px;white-space:nowrap;box-shadow:0 6px 16px rgba(26,20,19,0.22);font-family:var(--font-sans),sans-serif;">
        <span>${escapeHtml(marker.title)}</span>
      </div>
    `;
  }

  if (marker.variant === 'zone') {
    return `
      <div style="display:flex;align-items:center;gap:4px;background:#FFFFFF;color:#1A1413;border:1.5px solid #F50012;padding:3px 8px;border-radius:999px;font-weight:800;font-size:10.5px;white-space:nowrap;box-shadow:0 3px 10px rgba(26,20,19,0.12);font-family:var(--font-sans),sans-serif;">
        <span style="width:6px;height:6px;border-radius:999px;background:#F50012;display:inline-block;"></span>
        <span>${escapeHtml(marker.title)}</span>
      </div>
    `;
  }

  const pulseRing = marker.pulse
    ? `<span style="position:absolute;inset:-6px;border-radius:999px;border:2px solid ${style.bg};opacity:0.45;animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : '';

  return `
    <div style="position:relative;width:34px;height:34px;border-radius:999px;background:${style.bg};color:${style.text};border:2.5px solid ${style.border};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;box-shadow:0 6px 18px rgba(26,20,19,0.28);font-family:var(--font-sans),sans-serif;">
      ${pulseRing}
      <span style="position:relative;z-index:1;">${style.glyph}</span>
    </div>
  `;
}

export const CameroonMap: React.FC<CameroonMapProps> = ({
  center = [4.0511, 9.7279],
  zoom = 13,
  markers = [],
  routes = [],
  circles = [],
  heightClassName = 'h-[320px]',
  showCitySwitcher = false,
  showLocateButton = false,
  fitMarkers = false,
  interactiveHint,
  onMapClick,
  onMarkerClick,
  onCitySelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerGroupRef = useRef<import('leaflet').LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);

  const [isReady, setIsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>('douala');

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onMarkerClickRef.current = onMarkerClick;
  }, [onMapClick, onMarkerClick]);

  // Initialisation unique de Leaflet côté client
  useEffect(() => {
    let isMounted = true;
    let mapInstance: import('leaflet').Map | null = null;

    async function initMap() {
      if (!containerRef.current) return;
      const L = (await import('leaflet')).default;
      if (!isMounted || !containerRef.current) return;

      mapInstance = L.map(containerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO · Cameroun',
        maxZoom: 19,
      }).addTo(mapInstance);

      const group = L.layerGroup().addTo(mapInstance);

      mapInstance.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(
            Math.round(e.latlng.lat * 100000) / 100000,
            Math.round(e.latlng.lng * 100000) / 100000
          );
        }
      });

      mapRef.current = mapInstance;
      layerGroupRef.current = group;
      setIsReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
      layerGroupRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mise à jour de la caméra quand center/zoom changent
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isReady || fitMarkers) return;
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, isReady, fitMarkers]);

  // Synchronisation des marqueurs, cercles et trajets
  useEffect(() => {
    let cancelled = false;

    async function syncLayers() {
      const map = mapRef.current;
      const group = layerGroupRef.current;
      if (!map || !group || !isReady) return;

      const L = (await import('leaflet')).default;
      if (cancelled) return;

      group.clearLayers();

      // Cercles de couverture (quartiers)
      circles.forEach((c) => {
        const circle = L.circle([c.lat, c.lng], {
          radius: c.radiusMeters,
          color: c.color || '#F50012',
          weight: 1.5,
          opacity: 0.45,
          fillColor: c.color || '#F50012',
          fillOpacity: 0.08,
        });
        if (c.label) {
          circle.bindTooltip(escapeHtml(c.label), { direction: 'center' });
        }
        circle.addTo(group);
      });

      // Itinéraires (polylines)
      routes.forEach((route) => {
        if (route.points.length < 2) return;
        L.polyline(route.points, {
          color: route.color || '#F50012',
          weight: route.weight || 4,
          opacity: 0.85,
          dashArray: route.dashed ? '8, 8' : undefined,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(group);
      });

      // Marqueurs personnalisés
      const boundsPoints: [number, number][] = [];
      markers.forEach((m) => {
        boundsPoints.push([m.lat, m.lng]);
        const isPill = m.variant === 'city' || m.variant === 'zone';
        const icon = L.divIcon({
          className: 'rush-map-marker',
          html: buildMarkerHtml(m),
          iconSize: isPill ? undefined : [34, 34],
          iconAnchor: isPill ? [36, 14] : [17, 17],
          popupAnchor: [0, -16],
        });

        const leafletMarker = L.marker([m.lat, m.lng], { icon });

        const popupHtml = `
          <div style="font-family:var(--font-sans),sans-serif;min-width:140px;padding:2px;">
            ${m.badge ? `<div style="display:inline-block;background:#FFE9EB;color:#F50012;font-weight:900;font-size:10px;padding:2px 6px;border-radius:999px;margin-bottom:4px;">${escapeHtml(m.badge)}</div>` : ''}
            <div style="font-weight:900;font-size:13px;color:#1A1413;line-height:1.25;">${escapeHtml(m.title)}</div>
            ${m.subtitle ? `<div style="font-weight:600;font-size:11.5px;color:#4A4240;margin-top:3px;">${escapeHtml(m.subtitle)}</div>` : ''}
          </div>
        `;
        leafletMarker.bindPopup(popupHtml);

        leafletMarker.on('click', () => {
          if (onMarkerClickRef.current) {
            onMarkerClickRef.current(m);
          }
        });

        leafletMarker.addTo(group);
      });

      if (fitMarkers && boundsPoints.length >= 2) {
        map.fitBounds(boundsPoints, { padding: [42, 42], maxZoom: 15, animate: true });
      }
    }

    syncLayers();
    return () => {
      cancelled = true;
    };
  }, [markers, routes, circles, isReady, fitMarkers]);

  const handleSelectCity = (cityId: string) => {
    setActiveCity(cityId);
    const map = mapRef.current;
    if (!map) return;

    if (cityId === 'cameroun') {
      map.flyTo(CAMEROON_OVERVIEW.center, CAMEROON_OVERVIEW.zoom, { duration: 0.7 });
    } else {
      const target = CAMEROON_CITIES.find((c) => c.id === cityId);
      if (target) {
        map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.7 });
      }
    }
    if (onCitySelect) onCitySelect(cityId);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation indisponible sur ce navigateur.');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 100000) / 100000;
        const lng = Math.round(pos.coords.longitude * 100000) / 100000;
        mapRef.current?.flyTo([lat, lng], 15, { duration: 0.7 });
        if (onMapClickRef.current) {
          onMapClickRef.current(lat, lng);
        }
        setLocating(false);
      },
      () => {
        setGeoError('Autorisez la localisation GPS ou cliquez sur la carte.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const quickCities = [
    { id: 'cameroun', label: '🇨🇲 Tout le Cameroun' },
    { id: 'douala', label: 'Douala' },
    { id: 'yaounde', label: 'Yaoundé' },
    { id: 'bafoussam', label: 'Bafoussam' },
    { id: 'kribi', label: 'Kribi' },
    { id: 'limbe', label: 'Limbé' },
    { id: 'buea', label: 'Buea' },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-[20px] border border-border-warm bg-[#EDE9E5] shadow-warm-1">
      {/* Barre supérieure villes du Cameroun */}
      {(showCitySwitcher || showLocateButton) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-warm bg-surface/95 px-3 py-2.5 backdrop-blur-md">
          {showCitySwitcher && (
            <div className="hide-scroll flex flex-1 items-center gap-1.5 overflow-x-auto">
              {quickCities.map((c) => {
                const selected = activeCity === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCity(c.id)}
                    className={`flex-none rounded-pill px-3 py-1 text-[11.5px] font-extrabold transition-colors cursor-pointer ${
                      selected
                        ? 'bg-ink text-white shadow-sm'
                        : 'bg-bg-app-light text-ink-light hover:bg-brand-tint hover:text-brand'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          )}

          {showLocateButton && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={locating}
              className="flex items-center gap-1.5 rounded-pill bg-brand-tint px-3 py-1.5 text-[11.5px] font-black text-brand hover:bg-brand hover:text-white transition-colors cursor-pointer disabled:opacity-60"
            >
              <Icon name="pin" size={13} stroke={2.4} />
              {locating ? 'Localisation...' : 'Ma position GPS'}
            </button>
          )}
        </div>
      )}

      {/* Conteneur Leaflet */}
      <div className={`relative w-full ${heightClassName}`}>
        <div ref={containerRef} className="h-full w-full z-10" />

        {!isReady && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg-app-light text-ink-muted">
            <div className="sk-anim h-10 w-10 rounded-full mb-2" />
            <span className="text-[12px] font-bold">Chargement de la carte du Cameroun…</span>
          </div>
        )}

        {interactiveHint && isReady && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-pill bg-ink/88 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-warm-2 backdrop-blur-md">
            {interactiveHint}
          </div>
        )}

        {geoError && (
          <div className="absolute top-3 left-3 right-3 z-20 rounded-md bg-brand-tint px-3 py-2 text-[11.5px] font-bold text-brand shadow-warm-2">
            {geoError}
          </div>
        )}
      </div>
    </div>
  );
};

export default CameroonMap;
