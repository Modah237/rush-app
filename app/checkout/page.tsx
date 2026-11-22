'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useRushStore } from '@/context/rush-store-context';
import { useUserLocation } from '@/context/location-context';
import { formatPrice } from '@/lib/utils';
import { evaluatePromoCode } from '@/lib/promos';
import { placeOrder } from '@/app/actions/checkout';
import { PaymentMethod } from '@/types';
import Icon from '@/components/shared/icon';
import CameroonMap from '@/components/maps/cameroon-map';
import {
  CAMEROON_CITIES,
  CAMEROON_ZONES,
  PlaceSearchResult,
  findNearestCameroonZone,
} from '@/lib/cameroon-geo';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { addresses, userProfile, addLocalOrder, pushToast, trackEvent } = useRushStore();
  const { location: globalLocation, setLocation: setGlobalLocation } = useUserLocation();
  const [isPending, setIsPending] = useState(false);
  const [redirectingUrl, setRedirectingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];

  const [selectedCityId, setSelectedCityId] = useState(globalLocation.cityId || defaultAddr?.cityId || 'douala');
  const [selectedZoneId, setSelectedZoneId] = useState(globalLocation.zoneId || defaultAddr?.zoneId || 'dla-akwa');
  const [address, setAddress] = useState(globalLocation.address || defaultAddr?.address || 'Akwa, Rue Joss');
  const [landmarkHint, setLandmarkHint] = useState(globalLocation.landmarkNote || '');
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number }>({
    lat: globalLocation.lat ?? defaultAddr?.lat ?? 4.0536,
    lng: globalLocation.lng ?? defaultAddr?.lng ?? 9.6989,
  });
  const [showMapPicker, setShowMapPicker] = useState(true);
  const [phone, setPhone] = useState(userProfile.phone || '678451290');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(userProfile.preferredPayment || 'mtn');
  const [scheduledSlot, setScheduledSlot] = useState<string>('express');
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [substitutionPref, setSubstitutionPref] = useState<'call' | 'replace' | 'refund'>('call');
  const [note, setNote] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  useEffect(() => {
    const savedPromo = localStorage.getItem('rush_promo');
    if (savedPromo) {
      setPromoCodeInput(savedPromo);
      setAppliedPromo(savedPromo);
    }
  }, []);

  const cityZones = CAMEROON_ZONES.filter((z) => z.cityId === selectedCityId);
  const activeZone = CAMEROON_ZONES.find((z) => z.id === selectedZoneId) || cityZones[0] || CAMEROON_ZONES[0];

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
    const firstZone = CAMEROON_ZONES.find((z) => z.cityId === cityId);
    const cityObj = CAMEROON_CITIES.find((c) => c.id === cityId);
    if (firstZone) {
      setSelectedZoneId(firstZone.id);
      setPinCoords({ lat: firstZone.lat, lng: firstZone.lng });
      setAddress(`${firstZone.name}, ${firstZone.cityName}`);
    } else if (cityObj) {
      setPinCoords({ lat: cityObj.lat, lng: cityObj.lng });
      setAddress(`${cityObj.name}, Centre`);
    }
  };

  const handleZoneSelect = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    const z = CAMEROON_ZONES.find((item) => item.id === zoneId);
    if (z) {
      setPinCoords({ lat: z.lat, lng: z.lng });
      setAddress(`${z.name}, ${z.landmark.split('·')[0].trim()} (${z.cityName})`);
    }
  };

  const handleSavedAddressPick = (addrId: string) => {
    const picked = addresses.find((a) => a.id === addrId);
    if (!picked) return;
    setSelectedCityId(picked.cityId);
    setSelectedZoneId(picked.zoneId);
    setAddress(picked.address);
    setPinCoords({ lat: picked.lat, lng: picked.lng });
  };

  const handleMapPinClick = (lat: number, lng: number) => {
    setPinCoords({ lat, lng });
    const nearest = findNearestCameroonZone(lat, lng);
    setSelectedCityId(nearest.cityId);
    setSelectedZoneId(nearest.id);
    setAddress(`${nearest.name}, ${nearest.cityName} (GPS ${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  const promoEval = evaluatePromoCode(appliedPromo, cartTotal, paymentMethod);
  const deliveryThreshold = 10000;
  const isDeliveryFree = cartTotal >= deliveryThreshold || promoEval.freeDelivery;
  const deliveryFee = cartTotal === 0 ? 0 : isDeliveryFree ? 0 : activeZone.deliveryFee;
  const discountAmount = promoEval.valid ? promoEval.discountAmount : 0;
  const finalTotal = Math.max(0, cartTotal + deliveryFee + tipAmount - discountAmount);

  if (redirectingUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 gap-3">
        <span className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        <h2 className="font-black text-xl text-ink">Commande confirmée !</h2>
        <p className="text-ink-muted text-[13.5px] font-semibold">
          Redirection vers le suivi de votre commande en cours…
        </p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="font-black text-xl text-ink">Panier vide</h2>
        <p className="text-ink-muted mt-2">Vous devez ajouter des produits avant de valider.</p>
        <button
          onClick={() => router.push('/categories')}
          className="btn btn-dark h-11 bg-ink text-white font-bold px-6 rounded-pill mt-5 cursor-pointer"
        >
          Découvrir les produits
        </button>
      </div>
    );
  }

  const handleApplyInlinePromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    const res = evaluatePromoCode(code, cartTotal, paymentMethod);
    if (res.valid && res.promo) {
      setAppliedPromo(res.promo.code);
      localStorage.setItem('rush_promo', res.promo.code);
      pushToast(`Code ${res.promo.code} appliqué`, 'success');
    } else {
      setAppliedPromo(null);
      pushToast(res.reason || 'Code promo invalide', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMessage('Veuillez entrer une adresse de livraison.');
      return;
    }
    if (!phone.trim() || phone.replace(/\s+/g, '').length < 9) {
      setErrorMessage('Veuillez entrer un numéro camerounais valide (9 chiffres).');
      return;
    }

    setIsPending(true);
    setErrorMessage('');

    try {
      const combinedNote = [landmarkHint.trim() ? `Repère : ${landmarkHint.trim()}` : '', note.trim()]
        .filter(Boolean)
        .join(' · ');

      setGlobalLocation({
        cityId: activeZone.cityId,
        cityName: activeZone.cityName,
        zoneId: activeZone.id,
        zoneName: activeZone.name,
        address,
        landmarkNote: landmarkHint.trim(),
        lat: pinCoords.lat,
        lng: pinCoords.lng,
        deliveryFee: activeZone.deliveryFee,
        etaMinutes: activeZone.etaMinutes,
      });

      const res = await placeOrder({
        cart,
        promoCode: promoEval.valid ? promoEval.promo?.code ?? null : null,
        paymentMethod,
        deliveryAddress: address,
        deliveryPhone: `+237${phone.replace(/\s+/g, '')}`,
        note: combinedNote,
        deliveryZoneId: activeZone.id,
        deliveryLat: pinCoords.lat,
        deliveryLng: pinCoords.lng,
        tipAmount,
        scheduledSlot,
        substitutionPref,
      });

      if (res.success && res.paymentUrl) {
        if (res.orderSummary) {
          addLocalOrder(res.orderSummary);
        }
        trackEvent('order_placed', res.orderId || 'order', finalTotal, {
          payment: paymentMethod,
          city: activeZone.cityName,
          zone: activeZone.name,
        });
        setRedirectingUrl(res.paymentUrl);
        try {
          localStorage.setItem('rush_cart', '[]');
          localStorage.removeItem('rush_promo');
        } catch {
          // ignore
        }
        clearCart();
        pushToast(`Commande ${res.orderId} confirmée !`, 'success');

        setTimeout(() => {
          window.location.assign(res.paymentUrl!);
        }, 60);
      } else {
        setErrorMessage(res.message || 'Une erreur est survenue lors de la validation de la commande.');
        setIsPending(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Impossible de joindre le serveur de validation.');
      setIsPending(false);
    }
  };

  const paymentGateways = [
    { id: 'mtn', name: 'MTN Mobile Money', sub: 'Paiement direct sécurisé via Fapshi', tint: '#FFF6D6', ink: '#C79A00', tag: 'MTN' },
    { id: 'orange', name: 'Orange Money', sub: 'Paiement direct sécurisé via Fapshi', tint: '#FFE9D6', ink: '#E2730B', tag: 'OM' },
    { id: 'cash', name: 'Paiement à la livraison', sub: 'Espèces au livreur à réception', tint: '#E6F6EC', ink: '#15A05A', tag: '₣' },
  ];

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-border-warm-light">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
        >
          <Icon name="chevL" size={22} stroke={2.3} />
        </button>
        <div>
          <h1 className="font-black text-2xl text-ink tracking-tight">Commande</h1>
          <p className="text-[12px] font-semibold text-ink-muted">
            Livraison estimée en {activeZone.etaMinutes} min · {activeZone.cityName}
          </p>
        </div>
      </div>

      {/* Grid adaptative */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 items-start w-full">
        {/* Colonne gauche : Formulaires */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Section 1 : Adresse de livraison */}
          <div className="card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-extrabold text-[12.5px]">1</span>
                <h2 className="font-black text-base text-ink tracking-tight">Adresse de livraison (Cameroun)</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker((v) => !v)}
                className="text-[12px] font-black text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="pin" size={13} stroke={2.2} />
                {showMapPicker ? 'Masquer la carte' : 'Choisir sur la carte'}
              </button>
            </div>

            {/* Raccourcis adresses sauvegardées */}
            {addresses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSavedAddressPick(addr.id)}
                    className={`px-3 py-1.5 rounded-pill text-[11.5px] font-extrabold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      address === addr.address
                        ? 'bg-brand-tint text-brand border-brand'
                        : 'bg-bg-app-light text-ink-light border-border-warm hover:border-brand/40'
                    }`}
                  >
                    <Icon name="pin" size={12} />
                    {addr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Sélecteurs Ville & Quartier Cameroun */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">Ville au Cameroun</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => handleCitySelect(e.target.value)}
                  className="w-full bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm font-bold text-[13.5px] text-ink outline-none focus:ring-2 focus:ring-brand"
                >
                  {CAMEROON_CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.region})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">Quartier / Zone</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => handleZoneSelect(e.target.value)}
                  className="w-full bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm font-bold text-[13.5px] text-ink outline-none focus:ring-2 focus:ring-brand"
                >
                  {(cityZones.length > 0 ? cityZones : CAMEROON_ZONES).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (~{z.etaMinutes} min · {formatPrice(z.deliveryFee)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showMapPicker && (
              <div className="flex flex-col gap-2">
                <CameroonMap
                  center={[pinCoords.lat, pinCoords.lng]}
                  zoom={14}
                  heightClassName="h-[260px]"
                  showSearchBar
                  showLocateButton
                  showLayerToggle
                  interactiveHint="Recherchez un carrefour, cliquez sur la carte ou passez en vue Satellite"
                  onMapClick={handleMapPinClick}
                  onPlaceSelect={(place: PlaceSearchResult) => {
                    setPinCoords({ lat: place.lat, lng: place.lng });
                    const nearest = findNearestCameroonZone(place.lat, place.lng);
                    setSelectedCityId(nearest.cityId);
                    setSelectedZoneId(nearest.id);
                    setAddress(`${place.label} (${nearest.cityName})`);
                  }}
                  markers={[
                    {
                      id: 'checkout-pin',
                      lat: pinCoords.lat,
                      lng: pinCoords.lng,
                      title: 'Point de livraison RUSH',
                      subtitle: address,
                      badge: `${activeZone.etaMinutes} min · ${formatPrice(activeZone.deliveryFee)}`,
                      variant: 'customer',
                      pulse: true,
                    },
                  ]}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] font-bold text-ink-muted px-1">
                  <span>Zone détectée : <strong className="text-ink">{activeZone.cityName} · {activeZone.name}</strong></span>
                  <span>GPS : {pinCoords.lat.toFixed(4)}, {pinCoords.lng.toFixed(4)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">Quartier & Adresse précise</label>
                <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                  <Icon name="home" size={18} className="text-ink-placeholder" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex. Akwa, Rue Joss, à côté du supermarché..."
                    className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] ml-2 text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">
                  Repère visuel pour le Rusher (portail, carrefour, boutique proche)
                </label>
                <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                  <Icon name="pin" size={16} className="text-brand" />
                  <input
                    type="text"
                    value={landmarkHint}
                    onChange={(e) => setLandmarkHint(e.target.value)}
                    placeholder="Ex. Portail bleu juste après la pharmacie, 2e étage..."
                    className="w-full bg-transparent border-none outline-none font-semibold text-[13.5px] ml-2 text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">Numéro de téléphone (MTN / Orange)</label>
                <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                  <Icon name="phone" size={18} className="text-ink-placeholder" />
                  <span className="font-bold text-ink-muted text-[14.5px] ml-2">+237</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="678451290"
                    maxLength={9}
                    className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] ml-1 text-ink"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Méthode de paiement */}
          <div className="card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-extrabold text-[12.5px]">2</span>
              <h2 className="font-black text-base text-ink tracking-tight">Méthode de paiement</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {paymentGateways.map((g) => {
                const selected = paymentMethod === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPaymentMethod(g.id as PaymentMethod)}
                    className={`flex items-center gap-4 p-3.5 rounded-md border cursor-pointer text-left transition-all ${
                      selected
                        ? 'bg-brand-tint/30 border-brand shadow-sm'
                        : 'bg-surface border-border-warm hover:bg-bg-app-light'
                    }`}
                  >
                    <span
                      className="w-11 h-11 rounded-md flex items-center justify-center font-black text-[13.5px]"
                      style={{ backgroundColor: g.tint, color: g.ink }}
                    >
                      {g.tag}
                    </span>
                    <div className="flex-1">
                      <div className="font-extrabold text-[14px] text-ink leading-none">{g.name}</div>
                      <div className="text-[12px] text-ink-placeholder mt-1 font-semibold">{g.sub}</div>
                    </div>
                    <span
                      className="w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-all"
                      style={{
                        borderColor: selected ? 'var(--red)' : 'var(--line)',
                        backgroundColor: selected ? 'var(--red)' : '#ffffff',
                      }}
                    >
                      {selected && <Icon name="check" size={14} stroke={3} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Créneau de livraison */}
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">
                  Créneau de livraison
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'express', label: `Express (${activeZone.etaMinutes} min)` },
                    { id: 'today-13h', label: "Aujourd'hui 13h–14h" },
                    { id: 'today-18h', label: "Aujourd'hui 18h–19h" },
                    { id: 'tomorrow-9h', label: 'Demain 09h–10h' },
                  ].map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setScheduledSlot(slot.id)}
                      className={`h-9 px-2.5 rounded-md text-[11.5px] font-extrabold border cursor-pointer transition-colors ${
                        scheduledSlot === slot.id
                          ? 'bg-ink text-white border-ink'
                          : 'bg-bg-app-light text-ink-light border-border-warm hover:border-brand/40'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pourboire Rusher */}
              <div>
                <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">
                  Pourboire Rusher (100% au livreur)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 200, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTipAmount(amt)}
                      className={`h-9 rounded-md text-[11.5px] font-black border cursor-pointer transition-colors ${
                        tipAmount === amt
                          ? 'bg-success text-white border-success'
                          : 'bg-bg-app-light text-ink-light border-border-warm hover:border-success/40'
                      }`}
                    >
                      {amt === 0 ? 'Aucun' : `${amt} F`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-1">
              <label className="block text-[12px] font-extrabold text-ink-light mb-1.5 ml-1">
                En cas d’article épuisé en rayon
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'call', label: "M'appeler avant" },
                  { id: 'replace', label: 'Équivalent proche' },
                  { id: 'refund', label: 'Rembourser' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSubstitutionPref(opt.id as 'call' | 'replace' | 'refund')}
                    className={`h-9 px-3 rounded-md text-[11.5px] font-extrabold border cursor-pointer transition-colors ${
                      substitutionPref === opt.id
                        ? 'bg-brand-tint text-brand border-brand'
                        : 'bg-bg-app-light text-ink-light border-border-warm'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-1">
              <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">Note pour le livreur (optionnel)</label>
              <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex. Appelez-moi avant d'arriver..."
                  className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] text-ink"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : Résumé final & Paiement (Sidebar) */}
        <div className="w-full md:w-[360px] flex-none flex flex-col gap-5">
          <div className="card bg-surface p-4 rounded-lg shadow-warm-1 flex flex-col gap-4">
            <h3 className="font-extrabold text-[14.5px] text-ink tracking-tight flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-extrabold text-[12.5px]">3</span>
              Résumé final
            </h3>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.key} className="flex justify-between text-[13.5px] text-ink-light font-semibold">
                  <span className="truncate pr-4"><b className="text-brand font-black">{item.qty}×</b> {item.name}</span>
                  <span className="flex-none">{formatPrice(item.unit * item.qty)}</span>
                </div>
              ))}
            </div>

            {/* Code promo rapide au checkout */}
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Code promo (ex: RUSH25)"
                className="flex-1 bg-bg-app-light rounded-md px-3 h-9 border border-border-warm text-[12.5px] font-bold uppercase text-ink outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={handleApplyInlinePromo}
                className="h-9 px-3 rounded-md bg-ink text-white text-[12px] font-black cursor-pointer hover:bg-ink-light"
              >
                OK
              </button>
            </div>

            <div className="h-[1px] bg-border-warm-light my-1" />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px] text-ink-muted font-semibold">
                <span>Sous-total</span>
                <span className="text-ink">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink-muted font-semibold">
                <span>Livraison ({activeZone.name})</span>
                <span className={deliveryFee === 0 ? 'text-success font-black' : 'text-ink'}>
                  {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
                </span>
              </div>
              {tipAmount > 0 && (
                <div className="flex items-center justify-between text-[13px] text-success font-bold">
                  <span>Pourboire Rusher</span>
                  <span>+{formatPrice(tipAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && promoEval.promo && (
                <div className="flex items-center justify-between text-[13px] text-brand font-bold">
                  <span>Réduction ({promoEval.promo.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="h-[1px] bg-border-warm-light my-1" />

              <div className="flex items-center justify-between py-0.5">
                <span className="font-black text-[16px] text-ink">Total final</span>
                <span className="price font-black text-[20px] text-ink">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="text-[12.5px] font-bold text-brand p-2 bg-brand-tint border border-brand/20 rounded-md">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="hidden md:flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer hover:bg-brand-hover disabled:bg-brand/50 active:scale-98 transition-all mt-3"
            >
              {isPending ? (
                <span className="sk-anim w-5 h-5 rounded-full" />
              ) : (
                <>
                  Confirmer & payer
                  <Icon name="arrowR" size={19} stroke={2.2} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Raccourci Validation mobile collant en bas */}
        <div className="md:hidden fixed left-0 right-0 bottom-0 bg-surface/94 backdrop-blur-md border-t border-border-warm p-4.5 pb-safe flex items-center gap-4.5 z-30 shadow-warm-2">
          <div className="leading-none">
            <div className="text-[11.5px] text-ink-placeholder font-bold">Total final</div>
            <div className="price font-extrabold text-[20px] text-ink mt-1">{formatPrice(finalTotal)}</div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer active:scale-95 disabled:bg-brand/50 transition-all"
          >
            {isPending ? (
              <span className="sk-anim w-5 h-5 rounded-full" />
            ) : (
              <>
                Confirmer & payer
                <Icon name="arrowR" size={19} stroke={2.2} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
