'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  CAMEROON_CITIES,
  CAMEROON_OVERVIEW,
  PlaceSearchResult,
  fetchRoadRoute,
  searchCameroonPlaces,
} from '@/lib/cameroon-geo';
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
  showLayerToggle?: boolean;
  showSearchBar?: boolean;
  useRoadRouting?: boolean;
  fitMarkers?: boolean;
  interactiveHint?: string;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  onCitySelect?: (cityId: string) => void;
  onPlaceSelect?: (place: PlaceSearchResult) => void;
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
  showLayerToggle = true,
  showSearchBar = false,
  useRoadRouting = false,
  fitMarkers = false,
  interactiveHint,
  onMapClick,
  onMarkerClick,
  onCitySelect,
  onPlaceSelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null);
  const layerGroupRef = useRef<import('leaflet').LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);

  const [isReady, setIsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string>('douala');
  const [mapLayer, setMapLayer] = useState<'street' | 'satellite'>('street');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [resolvedRoutes, setResolvedRoutes] = useState<MapRoute[] | null>(null);

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

      const tile = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap · Cameroun',
        maxZoom: 19,
      }).addTo(mapInstance);
      tileLayerRef.current = tile;

      // Garantir le recalcul des dimensions Leaflet après montage CSS
      setTimeout(() => {
        mapInstance?.invalidateSize();
      }, 150);

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
      tileLayerRef.current = null;
      layerGroupRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bascule Plan / Satellite (Esri World Imagery très utile pour les quartiers du Cameroun)
  useEffect(() => {
    let cancelled = false;
    async function switchTiles() {
      const map = mapRef.current;
      if (!map || !isReady) return;
      const L = (await import('leaflet')).default;
      if (cancelled) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const url =
        mapLayer === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const attribution =
        mapLayer === 'satellite'
          ? '&copy; Esri Satellite · Cameroun'
          : '&copy; OpenStreetMap · Cameroun';

      const nextTile = L.tileLayer(url, { attribution, maxZoom: 19 }).addTo(map);
      nextTile.bringToBack();
      tileLayerRef.current = nextTile;
      map.invalidateSize();
    }
    switchTiles();
    return () => {
      cancelled = true;
    };
  }, [mapLayer, isReady]);

  // Résolution automatique d'itinéraire routier OSRM si useRoadRouting est activé
  useEffect(() => {
    if (!useRoadRouting || routes.length === 0) {
      setResolvedRoutes(null);
      return;
    }
    let cancelled = false;
    async function resolveAllRoutes() {
      const next = await Promise.all(
        routes.map(async (r) => {
          if (r.points.length !== 2) return r;
          const res = await fetchRoadRoute(r.points[0], r.points[1]);
          return { ...r, points: res.points };
        })
      );
      if (!cancelled) {
        setResolvedRoutes(next);
      }
    }
    resolveAllRoutes();
    return () => {
      cancelled = true;
    };
  }, [routes, useRoadRouting]);

  // Recherche de repères & adresses au Cameroun
  useEffect(() => {
    if (!showSearchBar || !searchOpen) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchCameroonPlaces(trimmed, true);
      if (!cancelled) {
        setSearchResults(results);
        setIsSearching(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, showSearchBar, searchOpen]);

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

      // Itinéraires (polylines : OSRM routier si résolu, sinon tracé direct)
      const activeRoutes = resolvedRoutes || routes;
      activeRoutes.forEach((route) => {
        if (route.points.length < 2) return;
        L.polyline(route.points, {
          color: route.color || '#F50012',
          weight: route.weight || 4,
          opacity: 0.88,
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
  }, [markers, routes, resolvedRoutes, circles, isReady, fitMarkers]);

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
        setGeoError('GPS bloqué par le navigateur — tapez votre carrefour ci-dessus ou cliquez sur la carte.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
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

  const handlePickPlace = (place: PlaceSearchResult) => {
    setSearchOpen(false);
    setSearchQuery(place.label);
    setSearchResults([]);
    mapRef.current?.flyTo([place.lat, place.lng], 15, { duration: 0.65 });
    if (onPlaceSelect) {
      onPlaceSelect(place);
    } else if (onMapClickRef.current) {
      onMapClickRef.current(place.lat, place.lng);
    }
  };

  return (
    <div className="relative w-full rounded-[20px] border border-border-warm bg-[#EDE9E5] shadow-warm-1">
      {/* Barre supérieure villes du Cameroun & contrôles */}
      {(showCitySwitcher || showLocateButton || showLayerToggle || showSearchBar) && (
        <div className="relative z-30 flex flex-col gap-2 rounded-t-[20px] border-b border-border-warm bg-surface/95 px-3 py-2.5 backdrop-blur-md">
          {showSearchBar && (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-md border border-border-warm bg-bg-app-light px-3 h-9.5 focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface">
                <Icon name="search" size={14} className="text-ink-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setSearchOpen(true);
                  }}
                  placeholder="Rechercher un carrefour, quartier ou repère au Cameroun (ex. Rond-point Deido, Bastos...)"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] font-bold text-ink outline-none placeholder:text-ink-muted"
                />
                {isSearching && <span className="text-[10.5px] font-bold text-ink-muted">...</span>}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setSearchOpen(false);
                    }}
                    className="text-ink-muted hover:text-brand cursor-pointer"
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>

              {searchOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-30 max-h-56 overflow-y-auto rounded-[14px] border border-border-warm bg-surface shadow-warm-3 p-1.5 flex flex-col gap-1">
                  {searchResults.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handlePickPlace(place)}
                      className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left hover:bg-bg-app-light cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-extrabold text-ink truncate">{place.label}</div>
                        <div className="text-[11px] font-semibold text-ink-muted truncate">{place.sublabel}</div>
                      </div>
                      <span className="flex-none rounded-pill bg-bg-app-light px-2 py-0.5 text-[10px] font-black text-ink-light">
                        {place.source === 'local' ? 'Repère RUSH' : 'OSM'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(showCitySwitcher || showLocateButton || showLayerToggle) && (
            <div className="flex flex-wrap items-center justify-between gap-2">
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

              <div className="flex items-center gap-1.5 ml-auto">
                {showLayerToggle && (
                  <div className="flex items-center rounded-pill border border-border-warm bg-bg-app-light p-0.5 text-[11px] font-extrabold">
                    <button
                      type="button"
                      onClick={() => setMapLayer('street')}
                      className={`rounded-pill px-2.5 py-1 cursor-pointer transition-colors ${
                        mapLayer === 'street' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                      }`}
                    >
                      Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapLayer('satellite')}
                      className={`rounded-pill px-2.5 py-1 cursor-pointer transition-colors ${
                        mapLayer === 'satellite' ? 'bg-ink text-white shadow-sm' : 'text-ink-muted'
                      }`}
                    >
                      Satellite
                    </button>
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
                    {locating ? 'GPS...' : 'Ma position'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteneur Leaflet */}
      <div className={`relative w-full overflow-hidden rounded-b-[20px] ${heightClassName}`}>
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
          <div className="absolute top-3 left-3 right-3 z-20 rounded-md bg-brand-tint border border-brand/20 px-3 py-2 text-[11.5px] font-bold text-brand shadow-warm-2 flex items-center justify-between gap-2">
            <span>{geoError}</span>
            <button
              type="button"
              onClick={() => setGeoError(null)}
              className="flex-none p-0.5 text-brand hover:opacity-75 cursor-pointer"
              aria-label="Fermer l'alerte GPS"
            >
              <Icon name="x" size={14} stroke={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameroonMap;
