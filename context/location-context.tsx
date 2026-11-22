'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CAMEROON_CITIES,
  CAMEROON_ZONES,
  PlaceSearchResult,
  findNearestCameroonZone,
} from '@/lib/cameroon-geo';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import CameroonMap from '@/components/maps/cameroon-map';

export interface UserDeliveryLocation {
  cityId: string;
  cityName: string;
  zoneId: string;
  zoneName: string;
  address: string;
  landmarkNote: string;
  lat: number;
  lng: number;
  deliveryFee: number;
  etaMinutes: number;
}

const DEFAULT_LOCATION: UserDeliveryLocation = {
  cityId: 'douala',
  cityName: 'Douala',
  zoneId: 'dla-akwa',
  zoneName: 'Akwa',
  address: 'Akwa, Rue Joss',
  landmarkNote: '',
  lat: 4.0536,
  lng: 9.6989,
  deliveryFee: 500,
  etaMinutes: 18,
};

interface LocationContextType {
  location: UserDeliveryLocation;
  setLocation: (next: UserDeliveryLocation) => void;
  selectCity: (cityId: string) => void;
  selectZone: (zoneId: string) => void;
  setFromCoordinates: (lat: number, lng: number, customLabel?: string) => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'rush_user_location';

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocationState] = useState<UserDeliveryLocation>(DEFAULT_LOCATION);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserDeliveryLocation>;
        if (parsed.cityId && parsed.zoneId && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          setLocationState({ ...DEFAULT_LOCATION, ...parsed });
        }
      }
    } catch {
      // Ignore invalid storage
    }
  }, []);

  const persist = (next: UserDeliveryLocation) => {
    setLocationState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const selectCity = (cityId: string) => {
    const firstZone = CAMEROON_ZONES.find((z) => z.cityId === cityId);
    const cityObj = CAMEROON_CITIES.find((c) => c.id === cityId);
    if (firstZone) {
      persist({
        ...location,
        cityId: firstZone.cityId,
        cityName: firstZone.cityName,
        zoneId: firstZone.id,
        zoneName: firstZone.name,
        address: `${firstZone.name}, ${firstZone.landmark.split('·')[0].trim()}`,
        lat: firstZone.lat,
        lng: firstZone.lng,
        deliveryFee: firstZone.deliveryFee,
        etaMinutes: firstZone.etaMinutes,
      });
    } else if (cityObj) {
      persist({
        ...location,
        cityId: cityObj.id,
        cityName: cityObj.name,
        zoneId: cityObj.id,
        zoneName: 'Centre',
        address: `${cityObj.name}, Centre`,
        lat: cityObj.lat,
        lng: cityObj.lng,
        deliveryFee: cityObj.baseFee,
        etaMinutes: 30,
      });
    }
  };

  const selectZone = (zoneId: string) => {
    const zone = CAMEROON_ZONES.find((z) => z.id === zoneId);
    if (!zone) return;
    persist({
      ...location,
      cityId: zone.cityId,
      cityName: zone.cityName,
      zoneId: zone.id,
      zoneName: zone.name,
      address: `${zone.name}, ${zone.landmark.split('·')[0].trim()}`,
      lat: zone.lat,
      lng: zone.lng,
      deliveryFee: zone.deliveryFee,
      etaMinutes: zone.etaMinutes,
    });
  };

  const setFromCoordinates = (lat: number, lng: number, customLabel?: string) => {
    const nearest = findNearestCameroonZone(lat, lng);
    persist({
      ...location,
      cityId: nearest.cityId,
      cityName: nearest.cityName,
      zoneId: nearest.id,
      zoneName: nearest.name,
      address: customLabel || `${nearest.name}, ${nearest.cityName}`,
      lat,
      lng,
      deliveryFee: nearest.deliveryFee,
      etaMinutes: nearest.etaMinutes,
    });
  };

  const cityZones = CAMEROON_ZONES.filter((z) => z.cityId === location.cityId);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation: persist,
        selectCity,
        selectZone,
        setFromCoordinates,
        isPickerOpen,
        openPicker: () => setIsPickerOpen(true),
        closePicker: () => setIsPickerOpen(false),
      }}
    >
      {children}

      {/* Modal Global Sélecteur d'Adresse & Repère Cameroun */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-ink/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-t-[26px] md:rounded-[26px] bg-surface shadow-warm-3 border border-border-warm overflow-hidden animate-scaleUp max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm-light">
              <div>
                <span className="text-[10.5px] font-black uppercase tracking-wider text-brand">
                  Zone de livraison · Cameroun
                </span>
                <h2 className="font-black text-lg text-ink leading-tight">
                  Où souhaitez-vous être livré ?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="w-9 h-9 rounded-full bg-bg-app-light text-ink hover:text-brand flex items-center justify-center cursor-pointer"
                aria-label="Fermer"
              >
                <Icon name="x" size={18} stroke={2.4} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">
                    Ville (Cameroun)
                  </label>
                  <select
                    value={location.cityId}
                    onChange={(e) => selectCity(e.target.value)}
                    className="w-full bg-bg-app-light rounded-md px-3 h-10.5 border border-border-warm font-bold text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand"
                  >
                    {CAMEROON_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.region})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">
                    Quartier / Tarif estimé
                  </label>
                  <select
                    value={location.zoneId}
                    onChange={(e) => selectZone(e.target.value)}
                    className="w-full bg-bg-app-light rounded-md px-3 h-10.5 border border-border-warm font-bold text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand"
                  >
                    {(cityZones.length > 0 ? cityZones : CAMEROON_ZONES).map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} · {z.etaMinutes} min ({formatPrice(z.deliveryFee)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <CameroonMap
                center={[location.lat, location.lng]}
                zoom={14}
                heightClassName="h-[250px]"
                showSearchBar
                showLocateButton
                showLayerToggle
                interactiveHint="Cliquez sur la carte ou recherchez un carrefour (Plan / Satellite)"
                onMapClick={(lat, lng) => setFromCoordinates(lat, lng)}
                onPlaceSelect={(place: PlaceSearchResult) =>
                  setFromCoordinates(place.lat, place.lng, place.label)
                }
                markers={[
                  {
                    id: 'global-user-pin',
                    lat: location.lat,
                    lng: location.lng,
                    title: 'Votre point de livraison',
                    subtitle: `${location.cityName} · ${location.zoneName}`,
                    badge: `${location.etaMinutes} min · ${formatPrice(location.deliveryFee)}`,
                    variant: 'customer',
                    pulse: true,
                  },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">
                    Adresse / Carrefour
                  </label>
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => persist({ ...location, address: e.target.value })}
                    placeholder="Ex. Akwa, Rue Joss"
                    className="w-full bg-bg-app-light rounded-md px-3.5 h-10.5 border border-border-warm font-semibold text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">
                    Repère visuel pour le Rusher
                  </label>
                  <input
                    type="text"
                    value={location.landmarkNote}
                    onChange={(e) => persist({ ...location, landmarkNote: e.target.value })}
                    placeholder="Ex. Portail bleu en face de la pharmacie"
                    className="w-full bg-bg-app-light rounded-md px-3.5 h-10.5 border border-border-warm font-semibold text-[13px] text-ink outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border-warm-light bg-bg-app">
              <div className="text-[12px] font-bold text-ink-light">
                Livraison : <strong className="text-brand">{formatPrice(location.deliveryFee)}</strong> ·{' '}
                <span>{location.etaMinutes} min</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="h-10 px-6 rounded-pill bg-brand text-white font-black text-[13px] shadow-brand hover:bg-brand-hover cursor-pointer"
              >
                Confirmer ce point
              </button>
            </div>
          </div>
        </div>
      )}
    </LocationContext.Provider>
  );
};

export function useUserLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useUserLocation doit être utilisé à l’intérieur d’un LocationProvider');
  }
  return ctx;
}
