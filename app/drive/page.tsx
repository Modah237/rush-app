'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';
import SafeImage from '@/components/shared/safe-image';
import { formatPrice } from '@/lib/utils';
import CameroonMap from '@/components/maps/cameroon-map';
import { useRushStore } from '@/context/rush-store-context';
import { PaymentMethod } from '@/types';
import {
  CAMEROON_LANDMARKS,
  CAMEROON_ZONES,
  PlaceSearchResult,
  calculateDistanceKm,
  estimateCameroonDelivery,
  fetchRoadRoute,
  generateDeliveryPin,
  resolveLocationFromText,
} from '@/lib/cameroon-geo';

export default function DriveB2BPage() {
  const router = useRouter();
  const { addLocalOrder, pushToast } = useRushStore();
  const [pickup, setPickup] = useState('Douala, Akwa');
  const [dropoff, setDropoff] = useState('Douala, Bonapriso');
  const [pickupCoords, setPickupCoords] = useState<[number, number]>([4.0536, 9.6989]);
  const [dropoffCoords, setDropoffCoords] = useState<[number, number]>([4.0273, 9.7014]);
  const [activePinMode, setActivePinMode] = useState<'pickup' | 'dropoff'>('dropoff');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [senderPhone, setSenderPhone] = useState('678451290');
  const [recipientPhone, setRecipientPhone] = useState('699445566');
  const [parcelDesc, setParcelDesc] = useState('Colis e-commerce WhatsApp');
  const [drivePayment, setDrivePayment] = useState<PaymentMethod>('mtn');
  const [simulationResult, setSimulationResult] = useState<{
    distanceKm: number;
    priceFcfa: number;
    etaMinutes: number;
  } | null>(null);

  const useCases = [
    { t: "Boutiques Instagram & WhatsApp", d: "Vos clients commandent en DM ou message. Vous saisissez l'adresse sur RUSH Drive, un coursier livre le colis et récupère l'argent si nécessaire." },
    { t: "Restaurants indépendants", d: "Gérez vos commandes en direct par téléphone et faites confiance au réseau RUSH pour livrer vos plats chauds en moins de 25 minutes." },
    { t: "Supermarchés & Épiceries", d: "Livrez vos paniers de courses lourds et volumineux grâce à des motos équipées de caisses de transport adaptées." },
    { t: "Pharmacies de garde", d: "Assurez la livraison urgente de médicaments à domicile de jour comme de nuit en toute sécurité." },
    { t: "Livraisons de bureaux", d: "Envoyez des contrats, plis et documents urgents d'une entreprise à une autre à travers Douala." }
  ];

  const steps = [
    { num: '1', title: 'Saisie', desc: 'Indiquez les adresses de départ (retrait) et de destination (dépôt).' },
    { num: '2', title: 'Tarif direct', desc: 'Le système calcule la distance et vous propose un prix transparent.' },
    { num: '3', title: 'Assignation', desc: 'Un Rusher disponible à proximité accepte et se rend au retrait.' },
    { num: '4', title: 'Suivi live', desc: 'Vous et votre client suivez la progression du livreur en temps réel sur la carte.' }
  ];

  const handleSimulateDistance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    setIsSimulating(true);
    const pResolved = resolveLocationFromText(pickup);
    const dResolved = resolveLocationFromText(dropoff);
    const pPt: [number, number] = [pResolved.lat, pResolved.lng];
    const dPt: [number, number] = [dResolved.lat, dResolved.lng];
    setPickupCoords(pPt);
    setDropoffCoords(dPt);

    const route = await fetchRoadRoute(pPt, dPt);
    const estimate = estimateCameroonDelivery(route.distanceKm);
    setSimulationResult({
      ...estimate,
      etaMinutes: route.durationMinutes,
    });
    setIsSimulating(false);
  };

  const handleDriveMapClick = async (lat: number, lng: number, customLabel?: string) => {
    if (activePinMode === 'pickup') {
      setPickupCoords([lat, lng]);
      setPickup(customLabel || `Point GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } else {
      setDropoffCoords([lat, lng]);
      setDropoff(customLabel || `Point GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
    const nextPickup: [number, number] = activePinMode === 'pickup' ? [lat, lng] : pickupCoords;
    const nextDropoff: [number, number] = activePinMode === 'dropoff' ? [lat, lng] : dropoffCoords;
    const dist = calculateDistanceKm(nextPickup[0], nextPickup[1], nextDropoff[0], nextDropoff[1]);
    setSimulationResult(estimateCameroonDelivery(dist));
    const route = await fetchRoadRoute(nextPickup, nextDropoff);
    setSimulationResult({
      ...estimateCameroonDelivery(route.distanceKm),
      etaMinutes: route.durationMinutes,
    });
  };

  return (
    <div className="page-enter flex flex-col gap-10 pb-16">
      {/* Navigation Header local */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-warm flex items-center justify-between h-14 px-4 md:px-0">
        <div className="flex items-center gap-1.5">
          <span className="text-info font-black text-lg">drive</span>
          <span className="text-ink font-semibold">.rush</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-bold text-ink-light">
          <a href="#cases" className="hover:text-info">Cas d'usage</a>
          <a href="#how" className="hover:text-info">Fonctionnement</a>
          <a href="#pricing" className="hover:text-info">Simulateur</a>
        </nav>
        <Link 
          href="#pricing" 
          className="btn h-9 bg-info text-white font-extrabold text-[12.5px] px-4 rounded-pill hover:opacity-90 active:scale-95 transition-transform"
        >
          Livraison Pro
        </Link>
      </header>

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] items-center gap-8 px-4 md:px-0 mt-4">
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-info/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-info">
            <Icon name="pkg" size={13} /> LOGISTIQUE B2B DOUALA
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-ink leading-tight">
            Vos livraisons à la demande, sans gérer de flotte.
          </h1>
          <p className="text-[15.5px] font-semibold text-ink-light leading-relaxed max-w-lg">
            Vous vendez sur WhatsApp, Instagram, téléphone ou site web ? RUSH s'occupe d'acheminer vos colis chez vos clients en 25 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <a 
              href="#pricing" 
              className="flex h-12 items-center justify-center gap-2 rounded-pill bg-info text-white font-black text-[13.5px] shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:opacity-95 active:scale-98 transition-all"
            >
              Demander une livraison pro
              <Icon name="arrowR" size={15} stroke={2.5} />
            </a>
            <a 
              href="#cases" 
              className="flex h-12 items-center justify-center rounded-pill border border-border-warm px-6 text-[13.5px] font-extrabold text-ink bg-surface hover:bg-bg-app-light transition-colors"
            >
              Voir les cas d'usage
            </a>
          </div>
        </div>

        {/* Visual Composition */}
        <div className="relative h-[330px] rounded-2xl overflow-hidden shadow-warm-3 border border-border-warm bg-surface">
          <SafeImage 
            src="/rush/drive/b2b-delivery.jpg" 
            alt="Livreur pro chargeant des colis dans Douala" 
            radius="16px" 
            aspectRatio="square" 
            className="h-full w-full object-cover" 
          />
        </div>
      </section>

      {/* Use Cases */}
      <section id="cases" className="flex flex-col gap-6 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight text-center">
          Ils utilisent drive.rush au quotidien
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {useCases.slice(0, 3).map((item) => (
            <div key={item.t} className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-info/10 text-info mb-4">
                <Icon name="pkg" size={22} />
              </span>
              <h3 className="font-extrabold text-[15.5px] text-ink">{item.t}</h3>
              <p className="text-[13px] font-semibold text-ink-light mt-2 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="flex flex-col gap-6 bg-surface p-6 rounded-[24px] border border-border-warm mx-4 md:mx-0 shadow-warm-1">
        <h2 className="text-xl font-black text-ink tracking-tight text-center">Comment ça fonctionne ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          {steps.map((step) => (
            <div key={step.num} className="text-center flex flex-col items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-info text-white font-black text-lg flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
                {step.num}
              </span>
              <h3 className="font-extrabold text-[13.5px] text-ink mt-1">{step.title}</h3>
              <p className="text-[11px] text-ink-placeholder font-medium leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Simulator + Cameroon Route Map */}
      <section id="pricing" className="flex flex-col gap-6 px-4 md:px-0 scroll-mt-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight">Simulez votre course sur la carte du Cameroun</h2>
          <p className="text-[13.5px] font-semibold text-ink-light mt-1">
            Sélectionnez vos points de retrait et d'arrivée ou cliquez directement sur la carte pour calculer la distance réelle (km) et le tarif transparent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <div className="card bg-surface p-5 rounded-[20px] border border-border-warm shadow-warm-1 w-full">
            <form onSubmit={handleSimulateDistance} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePinMode('pickup')}
                  className={`flex-1 py-2 px-3 rounded-pill text-[11.5px] font-black border cursor-pointer transition-colors ${
                    activePinMode === 'pickup'
                      ? 'bg-info text-white border-info'
                      : 'bg-bg-app-light text-ink-light border-border-warm'
                  }`}
                >
                  A · Placer le retrait sur la carte
                </button>
                <button
                  type="button"
                  onClick={() => setActivePinMode('dropoff')}
                  className={`flex-1 py-2 px-3 rounded-pill text-[11.5px] font-black border cursor-pointer transition-colors ${
                    activePinMode === 'dropoff'
                      ? 'bg-brand text-white border-brand'
                      : 'bg-bg-app-light text-ink-light border-border-warm'
                  }`}
                >
                  B · Placer la livraison sur la carte
                </button>
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-ink-light mb-1.5 ml-1">Point de retrait (Départ A)</label>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    const z = CAMEROON_ZONES.find((item) => item.id === val);
                    if (z) {
                      setPickup(`${z.cityName}, ${z.name}`);
                      setPickupCoords([z.lat, z.lng]);
                      return;
                    }
                    const lm = CAMEROON_LANDMARKS.find((item) => item.id === val);
                    if (lm) {
                      setPickup(`${lm.name}, ${lm.cityName}`);
                      setPickupCoords([lm.lat, lm.lng]);
                    }
                  }}
                  className="w-full mb-2 bg-bg-app-light border border-border-warm rounded-md px-3 h-9 text-[12.5px] font-bold text-ink outline-none"
                >
                  <option value="">Choisir un quartier ou repère Cameroun</option>
                  <optgroup label="Repères populaires (Carrefours & Centres)">
                    {CAMEROON_LANDMARKS.map((lm) => (
                      <option key={`plm-${lm.id}`} value={lm.id}>
                        {lm.cityName} — {lm.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Quartiers & Zones RUSH">
                    {CAMEROON_ZONES.map((z) => (
                      <option key={`p-${z.id}`} value={z.id}>
                        {z.cityName} — {z.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  type="text"
                  required
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Ex. Akwa, Boulangerie Zépol"
                  className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-ink-light mb-1.5 ml-1">Point de livraison (Arrivée B)</label>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    const z = CAMEROON_ZONES.find((item) => item.id === val);
                    if (z) {
                      setDropoff(`${z.cityName}, ${z.name}`);
                      setDropoffCoords([z.lat, z.lng]);
                      return;
                    }
                    const lm = CAMEROON_LANDMARKS.find((item) => item.id === val);
                    if (lm) {
                      setDropoff(`${lm.name}, ${lm.cityName}`);
                      setDropoffCoords([lm.lat, lm.lng]);
                    }
                  }}
                  className="w-full mb-2 bg-bg-app-light border border-border-warm rounded-md px-3 h-9 text-[12.5px] font-bold text-ink outline-none"
                >
                  <option value="">Choisir un quartier ou repère Cameroun</option>
                  <optgroup label="Repères populaires (Carrefours & Centres)">
                    {CAMEROON_LANDMARKS.map((lm) => (
                      <option key={`dlm-${lm.id}`} value={lm.id}>
                        {lm.cityName} — {lm.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Quartiers & Zones RUSH">
                    {CAMEROON_ZONES.map((z) => (
                      <option key={`d-${z.id}`} value={z.id}>
                        {z.cityName} — {z.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <input
                  type="text"
                  required
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Ex. Bonapriso, Rue des Palmiers"
                  className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="btn btn-primary h-11 bg-info text-white font-extrabold text-[13px] rounded-pill shadow-sm cursor-pointer hover:opacity-90 disabled:opacity-50 mt-2"
              >
                {isSimulating ? "Calcul de l'itinéraire..." : "Calculer distance & tarif"}
              </button>
            </form>

            {simulationResult !== null && (
              <div className="mt-5 p-4 rounded-lg bg-green-tint/50 border border-success/10 text-center flex flex-col items-center gap-1 select-none fade-in">
                <span className="text-[11px] font-black uppercase text-success tracking-wider">
                  Tarif Estimé · {simulationResult.distanceKm} km · ~{simulationResult.etaMinutes} min
                </span>
                <span className="font-black text-2xl text-success mt-0.5">{formatPrice(simulationResult.priceFcfa)}</span>
                <p className="text-[11.5px] text-ink-light font-medium mt-1 leading-snug">
                  Récupération directe au point A et livraison express au point B par un Rusher vérifié.
                </p>
              </div>
            )}
          </div>

          <CameroonMap
            center={pickupCoords}
            zoom={13}
            fitMarkers
            useRoadRouting
            showSearchBar
            showCitySwitcher
            showLayerToggle
            heightClassName="h-[430px]"
            interactiveHint={`Cliquez sur la carte ou cherchez un repère pour placer le point ${activePinMode === 'pickup' ? 'A (Retrait)' : 'B (Livraison)'}`}
            onMapClick={(lat, lng) => handleDriveMapClick(lat, lng)}
            onPlaceSelect={(place: PlaceSearchResult) => handleDriveMapClick(place.lat, place.lng, place.label)}
            markers={[
              {
                id: 'drive-pickup',
                lat: pickupCoords[0],
                lng: pickupCoords[1],
                title: 'Retrait (A)',
                subtitle: pickup,
                badge: 'Départ',
                variant: 'pickup',
              },
              {
                id: 'drive-dropoff',
                lat: dropoffCoords[0],
                lng: dropoffCoords[1],
                title: 'Livraison (B)',
                subtitle: dropoff,
                badge: 'Arrivée',
                variant: 'dropoff',
              },
            ]}
            routes={[
              {
                id: 'drive-route',
                points: [pickupCoords, dropoffCoords],
                color: '#2563EB',
                dashed: true,
                weight: 4,
              },
            ]}
          />
        </div>
      </section>

      {/* Bottom CTA + Instant B2B Dispatch */}
      <section className="py-10 bg-gradient-to-br from-ink to-ink-light text-white rounded-[24px] shadow-warm-2 flex flex-col items-center gap-4.5 mx-4 md:mx-0 px-6">
        <div className="text-center flex flex-col items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Prêt à expédier avec drive.rush ?</h2>
          <p className="text-[14.5px] text-white/70 font-semibold max-w-md">
            Commandez immédiatement un Rusher pour récupérer votre colis chez vous et le livrer à votre client.
          </p>
          <button
            type="button"
            onClick={() => setShowDispatchForm((v) => !v)}
            className="flex h-12 px-6 items-center justify-center gap-2 rounded-pill bg-info text-white font-black text-[13.5px] shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:opacity-95 active:scale-98 transition-all mt-1 cursor-pointer"
          >
            {showDispatchForm ? 'Masquer le formulaire' : 'Commander un coursier B2B maintenant'}
            <Icon name="arrowR" size={15} stroke={2.5} />
          </button>
        </div>

        {showDispatchForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const dist = calculateDistanceKm(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]);
              const est = simulationResult || estimateCameroonDelivery(dist);
              const drvId = `DRV-${Math.floor(10000 + Math.random() * 89999)}`;
              const nowIso = new Date().toISOString();
              addLocalOrder({
                id: drvId,
                user_id: null,
                shop_id: null,
                courier_id: null,
                status: 'confirmed',
                subtotal: 0,
                delivery_fee: est.priceFcfa,
                discount_amount: 0,
                total_amount: est.priceFcfa,
                delivery_address: dropoff,
                delivery_phone: `+237${recipientPhone.replace(/\s+/g, '')}`,
                courier_name: 'Brice T.',
                courier_phone: '+237 6 99 44 55 66',
                eta_minutes: est.etaMinutes,
                note: `Retrait : ${pickup} (Tél expéditeur +237${senderPhone}) · Colis : ${parcelDesc}`,
                delivery_zone_id: null,
                promo_code_id: null,
                created_at: nowIso,
                updated_at: nowIso,
                shop_name: `drive.rush · ${pickup}`,
                delivery_lat: dropoffCoords[0],
                delivery_lng: dropoffCoords[1],
                delivery_pin: generateDeliveryPin(drvId),
                payment_method: drivePayment,
                items: [{ product_id: 'drive-parcel', name: parcelDesc, qty: 1, unit_price: est.priceFcfa }],
              });
              pushToast(`Course B2B ${drvId} dispatchée !`, 'success');
              router.push(`/orders/${drvId}`);
            }}
            className="w-full max-w-xl mt-4 bg-surface text-ink rounded-[20px] p-5 shadow-warm-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left"
          >
            <div className="sm:col-span-2 text-[12px] font-black text-info uppercase tracking-wider">
              Expédition Express : {pickup} → {dropoff} ({formatPrice((simulationResult || estimateCameroonDelivery(calculateDistanceKm(pickupCoords[0], pickupCoords[1], dropoffCoords[0], dropoffCoords[1]))).priceFcfa)})
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-ink-light mb-1">Tél. Expéditeur (+237)</label>
              <input
                type="tel"
                required
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full bg-bg-app-light border border-border-warm rounded-md px-3 h-10 text-[13px] font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-ink-light mb-1">Tél. Destinataire (+237)</label>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full bg-bg-app-light border border-border-warm rounded-md px-3 h-10 text-[13px] font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-ink-light mb-1">Nature du colis</label>
              <input
                type="text"
                required
                value={parcelDesc}
                onChange={(e) => setParcelDesc(e.target.value)}
                className="w-full bg-bg-app-light border border-border-warm rounded-md px-3 h-10 text-[13px] font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold text-ink-light mb-1">Paiement course</label>
              <select
                value={drivePayment}
                onChange={(e) => setDrivePayment(e.target.value as PaymentMethod)}
                className="w-full bg-bg-app-light border border-border-warm rounded-md px-3 h-10 text-[13px] font-bold"
              >
                <option value="mtn">MTN MoMo</option>
                <option value="orange">Orange Money</option>
                <option value="cash">Cash à la livraison</option>
              </select>
            </div>
            <button
              type="submit"
              className="sm:col-span-2 h-11 rounded-pill bg-info text-white font-black text-[13px] cursor-pointer hover:opacity-95 mt-1"
            >
              Confirmer & Suivre le Rusher en direct →
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
