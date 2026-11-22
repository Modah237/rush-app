'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import CameroonMap, { MapCircle, MapMarker } from '@/components/maps/cameroon-map';
import {
  ACTIVE_CAMEROON_RIDERS,
  CAMEROON_CITIES,
  CAMEROON_LANDMARKS,
  CAMEROON_OVERVIEW,
  CAMEROON_ZONES,
  PlaceSearchResult,
  calculateDistanceKm,
} from '@/lib/cameroon-geo';
import { useUserLocation } from '@/context/location-context';
import { useRushStore } from '@/context/rush-store-context';
import { MOCK_SHOPS } from '@/lib/mock-data';
import { shopPath } from '@/lib/routes';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';

export default function CameroonMapPage() {
  const { location: userLoc, selectZone, setFromCoordinates } = useUserLocation();
  const { pushToast } = useRushStore();
  const [selectedCityId, setSelectedCityId] = useState<string>(userLoc.cityId || 'douala');
  const [showShops, setShowShops] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRiders, setShowRiders] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(userLoc.zoneId || null);

  const selectedCity = useMemo(
    () => CAMEROON_CITIES.find((c) => c.id === selectedCityId) || null,
    [selectedCityId]
  );

  const mapCenter: [number, number] = selectedCity
    ? [selectedCity.lat, selectedCity.lng]
    : CAMEROON_OVERVIEW.center;

  const mapZoom = selectedCity ? selectedCity.zoom : CAMEROON_OVERVIEW.zoom;

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];

    // Pôles urbains du Cameroun (toujours visibles en vue nationale ou sélectionnée)
    CAMEROON_CITIES.forEach((c) => {
      list.push({
        id: `city-${c.id}`,
        lat: c.lat,
        lng: c.lng,
        title: c.name,
        subtitle: `${c.region} · ${c.activeShops} boutiques · ${c.activeRiders} Rushers`,
        badge:
          c.status === 'active'
            ? 'Livraison 25 min'
            : c.status === 'expansion'
              ? 'Zone active'
              : 'RUSH Drive B2B',
        variant: 'city',
      });
    });

    if (showZones) {
      CAMEROON_ZONES.forEach((z) => {
        list.push({
          id: `zone-${z.id}`,
          lat: z.lat,
          lng: z.lng,
          title: `${z.name} · ${formatPrice(z.deliveryFee)}`,
          subtitle: `${z.cityName} (${z.landmark}) · ~${z.etaMinutes} min`,
          badge: z.cityName,
          variant: 'zone',
        });
      });
    }

    if (showShops) {
      MOCK_SHOPS.forEach((s) => {
        if (typeof s.lat === 'number' && typeof s.lng === 'number') {
          list.push({
            id: `shop-${s.id}`,
            lat: s.lat,
            lng: s.lng,
            title: s.name,
            subtitle: `${s.category} · ${s.quarter || s.city || 'Douala'} · ${s.eta_minutes} min`,
            badge: s.delivery_fee === 0 ? 'Livraison gratuite' : formatPrice(s.delivery_fee),
            variant: 'shop',
          });
        }
      });
    }

    if (showRiders) {
      ACTIVE_CAMEROON_RIDERS.forEach((r) => {
        list.push({
          id: `rider-${r.id}`,
          lat: r.lat,
          lng: r.lng,
          title: `${r.name} (Rusher)`,
          subtitle: `${r.vehicle} · ${r.quarter}`,
          badge: r.status === 'available' ? 'Disponible' : 'En course',
          variant: 'rider',
          pulse: r.status === 'delivering',
        });
      });
    }

    // Marqueur de position actuelle du client
    list.push({
      id: 'user-current-loc',
      lat: userLoc.lat,
      lng: userLoc.lng,
      title: `Votre point (${userLoc.zoneName})`,
      subtitle: `${userLoc.address} · Livraison ${formatPrice(userLoc.deliveryFee)}`,
      badge: 'Ma zone',
      variant: 'customer',
      pulse: true,
    });

    return list;
  }, [showShops, showZones, showRiders, userLoc]);

  const circles: MapCircle[] = useMemo(() => {
    if (!showZones) return [];
    return CAMEROON_ZONES.map((z) => ({
      id: `circle-${z.id}`,
      lat: z.lat,
      lng: z.lng,
      radiusMeters: z.radiusMeters,
      color: selectedZoneId === z.id ? '#15A05A' : '#F50012',
    }));
  }, [showZones, selectedZoneId]);

  const cityZones = useMemo(() => {
    if (selectedCityId === 'cameroun') return CAMEROON_ZONES;
    return CAMEROON_ZONES.filter((z) => z.cityId === selectedCityId);
  }, [selectedCityId]);

  return (
    <div className="page-enter flex flex-col gap-6 px-4 md:px-0 mt-4 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-warm-light pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand-tint px-3 py-1 text-[11px] font-black uppercase tracking-wider text-brand">
            <Icon name="pin" size={12} stroke={2.5} /> Réseau RUSH Cameroun
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-ink mt-2">
            Carte des zones, boutiques & Rushers au Cameroun
          </h1>
          <p className="text-[13.5px] font-semibold text-ink-light mt-1 max-w-2xl">
            Explorez la couverture RUSH dans les 10 régions du Cameroun : quartiers couverts à Douala & Yaoundé, tarifs transparents en FCFA et boutiques partenaires en direct.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShops((v) => !v)}
            className={`rounded-pill px-3.5 py-2 text-[12px] font-extrabold border transition-colors cursor-pointer ${
              showShops
                ? 'bg-ink text-white border-ink'
                : 'bg-surface text-ink-light border-border-warm'
            }`}
          >
            🏪 Boutiques ({MOCK_SHOPS.length})
          </button>
          <button
            type="button"
            onClick={() => setShowZones((v) => !v)}
            className={`rounded-pill px-3.5 py-2 text-[12px] font-extrabold border transition-colors cursor-pointer ${
              showZones
                ? 'bg-brand text-white border-brand'
                : 'bg-surface text-ink-light border-border-warm'
            }`}
          >
            📍 Zones ({CAMEROON_ZONES.length})
          </button>
          <button
            type="button"
            onClick={() => setShowRiders((v) => !v)}
            className={`rounded-pill px-3.5 py-2 text-[12px] font-extrabold border transition-colors cursor-pointer ${
              showRiders
                ? 'bg-success text-white border-success'
                : 'bg-surface text-ink-light border-border-warm'
            }`}
          >
            🏍️ Rushers ({ACTIVE_CAMEROON_RIDERS.length})
          </button>
        </div>
      </div>

      {/* Layout Carte + Panneau Latéral */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.55fr] gap-6 items-start">
        <div className="flex flex-col gap-4">
          <CameroonMap
            center={mapCenter}
            zoom={mapZoom}
            markers={markers}
            circles={circles}
            heightClassName="h-[460px] md:h-[560px]"
            showSearchBar
            showCitySwitcher
            showLocateButton
            showLayerToggle
            interactiveHint="Recherchez un carrefour, passez en Satellite ou cliquez sur un marqueur"
            onCitySelect={(cityId) => setSelectedCityId(cityId)}
            onPlaceSelect={(place: PlaceSearchResult) => {
              setFromCoordinates(place.lat, place.lng, place.label);
              if (place.cityId) setSelectedCityId(place.cityId);
              if (place.zoneId) setSelectedZoneId(place.zoneId);
              pushToast(`Zone de livraison définie sur ${place.label}`, 'success');
            }}
            onMarkerClick={(m) => {
              if (m.id.startsWith('city-')) {
                setSelectedCityId(m.id.replace('city-', ''));
              } else if (m.id.startsWith('zone-')) {
                setSelectedZoneId(m.id.replace('zone-', ''));
              }
            }}
          />

          {/* Toutes les 12 villes / 10 régions du Cameroun */}
          <div className="card bg-surface p-4 rounded-[20px] border border-border-warm-light shadow-warm-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-[15px] text-ink">
                Couverture nationale (10 Régions du Cameroun)
              </h2>
              <button
                type="button"
                onClick={() => setSelectedCityId('cameroun')}
                className="text-[12px] font-black text-brand hover:underline cursor-pointer"
              >
                Voir tout le Cameroun
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {CAMEROON_CITIES.map((city) => {
                const isSelected = selectedCityId === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => setSelectedCityId(city.id)}
                    className={`text-left p-3 rounded-[14px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-tint/40 border-brand shadow-sm'
                        : 'bg-bg-app-light border-border-warm-light hover:border-brand/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-[13px] text-ink">{city.name}</span>
                      <span
                        className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-pill ${
                          city.status === 'active'
                            ? 'bg-green-tint text-success'
                            : city.status === 'expansion'
                              ? 'bg-amber-tint text-warning'
                              : 'bg-info/10 text-info'
                        }`}
                      >
                        {city.status === 'active' ? 'Live' : city.status === 'expansion' ? 'Actif' : 'B2B'}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-ink-muted mt-0.5">{city.region}</div>
                    <div className="text-[11px] font-bold text-ink-light mt-1.5">
                      {city.etaLabel} · dès {formatPrice(city.baseFee)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panneau quartiers & boutiques */}
        <div className="flex flex-col gap-4">
          <div className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-[16px] text-ink">
                {selectedCity ? `Quartiers à ${selectedCity.name}` : 'Quartiers couverts au Cameroun'}
              </h2>
              <span className="rounded-pill bg-bg-app-light px-2.5 py-1 text-[11px] font-black text-ink-light">
                {cityZones.length} zones
              </span>
            </div>

            {cityZones.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                {cityZones.map((z) => {
                  const isActiveUserZone = userLoc.zoneId === z.id;
                  return (
                    <div
                      key={z.id}
                      onClick={() => setSelectedZoneId(z.id)}
                      className={`w-full text-left p-3 rounded-[14px] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        selectedZoneId === z.id || isActiveUserZone
                          ? 'bg-brand-tint/35 border-brand'
                          : 'bg-bg-app-light/70 border-border-warm-light hover:bg-bg-app-light'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-[13.5px] text-ink truncate">
                          {z.name} <span className="text-ink-muted font-semibold">· {z.cityName}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-ink-muted truncate mt-0.5">
                          {z.landmark}
                        </div>
                      </div>
                      <div className="text-right flex-none flex flex-col items-end gap-1">
                        <div className="font-black text-[13px] text-brand">{formatPrice(z.deliveryFee)}</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectZone(z.id);
                            setSelectedZoneId(z.id);
                            pushToast(`Livraison réglée sur ${z.cityName} · ${z.name}`, 'success');
                          }}
                          className={`rounded-pill px-2 py-0.5 text-[10px] font-black cursor-pointer ${
                            isActiveUserZone
                              ? 'bg-success text-white'
                              : 'bg-ink text-white hover:bg-brand'
                          }`}
                        >
                          {isActiveUserZone ? '✓ Ma zone' : 'Livrer ici'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-[14px] bg-bg-app-light text-[12.5px] font-semibold text-ink-light leading-relaxed">
                Cette ville est actuellement ouverte pour les courses B2B sur demande via{' '}
                <Link href="/drive" className="text-info font-black hover:underline">
                  drive.rush
                </Link>
                .
              </div>
            )}
          </div>

          {/* Repères rapides Cameroun */}
          <div className="card bg-surface p-4 rounded-[20px] border border-border-warm-light shadow-warm-1 flex flex-col gap-2.5">
            <h2 className="font-black text-[14.5px] text-ink">Carrefours & Repères ({CAMEROON_LANDMARKS.length})</h2>
            <div className="flex flex-wrap gap-1.5">
              {CAMEROON_LANDMARKS.slice(0, 8).map((lm) => (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => {
                    setFromCoordinates(lm.lat, lm.lng, `${lm.name}, ${lm.cityName}`);
                    setSelectedCityId(lm.cityId);
                    pushToast(`Repère sélectionné : ${lm.name}`, 'info');
                  }}
                  className="rounded-pill bg-bg-app-light border border-border-warm-light px-2.5 py-1 text-[11px] font-bold text-ink-light hover:border-brand hover:text-brand cursor-pointer transition-colors"
                >
                  {lm.name}
                </button>
              ))}
            </div>
          </div>

          {/* Boutiques partenaires sur la carte */}
          <div className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <h2 className="font-black text-[16px] text-ink">Boutiques géolocalisées</h2>
            <div className="flex flex-col gap-2.5">
              {MOCK_SHOPS.map((shop) => {
                const distFromUser =
                  typeof shop.lat === 'number' && typeof shop.lng === 'number'
                    ? calculateDistanceKm(userLoc.lat, userLoc.lng, shop.lat, shop.lng)
                    : null;
                return (
                  <Link
                    key={shop.id}
                    href={shopPath(shop.id)}
                    className="flex items-center justify-between gap-3 p-3 rounded-[14px] bg-bg-app-light/70 border border-border-warm-light hover:border-brand/30 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-[13px] text-ink truncate">{shop.name}</div>
                      <div className="text-[11px] font-semibold text-ink-muted mt-0.5">
                        {shop.quarter || 'Douala'} · {distFromUser !== null ? `${distFromUser} km · ` : ''}
                        {shop.eta_minutes} min · ★ {shop.rating}
                      </div>
                    </div>
                    <span className="text-[11.5px] font-black text-brand flex-none">
                      {shop.delivery_fee === 0 ? 'Gratuit' : formatPrice(shop.delivery_fee)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2.5">
            <Link
              href="/categories"
              className="flex-1 h-11 rounded-pill bg-brand text-white font-black text-[13px] flex items-center justify-center shadow-brand hover:bg-brand-hover"
            >
              Commander maintenant
            </Link>
            <Link
              href="/drive"
              className="h-11 px-4 rounded-pill bg-ink text-white font-black text-[13px] flex items-center justify-center hover:bg-ink-light"
            >
              drive.rush
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
