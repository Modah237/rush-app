'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MOCK_SHOPS } from '@/lib/mock-data';
import { OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import Link from 'next/link';
import CameroonMap from '@/components/maps/cameroon-map';
import { calculateDistanceKm, generateDeliveryPin, resolveLocationFromText } from '@/lib/cameroon-geo';
import { useRushStore } from '@/context/rush-store-context';
import { uploadRushFile } from '@/lib/storage';
import { publishRiderTelemetry } from '@/lib/telemetry';

export default function RiderDashboardPage() {
  const { getMergedOrders, updateOrderStatus, pushToast } = useRushStore();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'unsubmitted'>('unsubmitted');
  const [isAvailable, setIsAvailable] = useState(false);
  const [isGpsBroadcasting, setIsGpsBroadcasting] = useState(false);
  const [gpsStatusText, setGpsStatusText] = useState<string>('');
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({});
  const activeOrders = getMergedOrders().filter((o) => o.status === 'out_for_delivery' || o.status === 'preparing');

  // Formulaire d'identité + Upload réel Supabase Storage
  const [vehicleType, setVehicleType] = useState('moto');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [idCardFile, setIdCardFile] = useState<string | null>(null);
  const [recordFile, setRecordFile] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<'cni' | 'casier' | null>(null);
  const cniInputRef = useRef<HTMLInputElement>(null);
  const casierInputRef = useRef<HTMLInputElement>(null);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'cni' | 'casier') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(kind);
    const res = await uploadRushFile(file, 'courier-docs', kind);
    setUploadingDoc(null);
    if (!res.success) {
      pushToast(res.message || 'Erreur lors du téléversement', 'error');
      return;
    }
    if (kind === 'cni') {
      setIdCardFile(`${res.fileName} (${res.mode === 'supabase' ? 'Storage' : 'Local'})`);
    } else {
      setRecordFile(`${res.fileName} (${res.mode === 'supabase' ? 'Storage' : 'Local'})`);
    }
    pushToast(res.message || 'Document chargé', 'success');
  };

  useEffect(() => {
    if (!isGpsBroadcasting || activeOrders.length === 0) return;
    const targetOrder = activeOrders[0];
    let watchId: number | null = null;
    let stepCount = 0;

    const shopLoc = MOCK_SHOPS.find((s) => s.id === targetOrder.shop_id);
    const pLat = shopLoc?.lat ?? 4.0548;
    const pLng = shopLoc?.lng ?? 9.7012;
    const dLoc = resolveLocationFromText(targetOrder.delivery_address);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 28;
          publishRiderTelemetry({
            orderId: targetOrder.id,
            riderName: targetOrder.courier_name || 'Eric N.',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speedKmh: speed,
            updatedAt: new Date().toISOString(),
            source: 'gps',
          });
          setGpsStatusText(
            `GPS réel diffusé (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          );
        },
        () => {
          setGpsStatusText('GPS matériel refusé — diffusion simulée Douala active.');
        },
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }

    const simTimer = setInterval(() => {
      stepCount = (stepCount + 1) % 10;
      const ratio = 0.15 + stepCount * 0.085;
      const lat = pLat + (dLoc.lat - pLat) * ratio;
      const lng = pLng + (dLoc.lng - pLng) * ratio;
      publishRiderTelemetry({
        orderId: targetOrder.id,
        riderName: targetOrder.courier_name || 'Eric N.',
        lat,
        lng,
        speedKmh: 32,
        updatedAt: new Date().toISOString(),
        source: 'simulated',
      });
      setGpsStatusText(`Télémétrie live diffusée pour ${targetOrder.id} (${Math.round(ratio * 100)}%)`);
    }, 2500);

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(simTimer);
    };
  }, [isGpsBroadcasting, activeOrders]);

  const handleSubmitIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationStatus('pending');
  };

  const handleUpdateDelivery = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status, 'Livraison validée par le Rusher');
    pushToast(`Course ${orderId} marquée : ${status}`, 'success');
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-12">
      {/* Back to Acquisition / Header */}
      <div className="flex items-center gap-3">
        <Link href="/rider" className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer hover:text-brand transition-colors">
          <Icon name="chevL" size={22} stroke={2.3} />
        </Link>
        <div>
          <h2 className="font-extrabold text-[13px] text-success uppercase tracking-wider">rider.rush</h2>
          <h1 className="font-black text-xl text-ink leading-tight">Tableau de bord</h1>
        </div>
      </div>

      {/* Header Livreur */}
      <div className="bg-gradient-to-br from-[#15A05A] to-[#0D6B3C] text-white p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-warm-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
              <Icon name="truck" size={20} />
            </span>
            <h1 className="font-black text-xl tracking-tight">Espace Rushers</h1>
          </div>
          <p className="text-[12px] text-white/60 font-semibold mt-1">
            Rusher Partenaire · Moto de livraison · Douala
          </p>
        </div>

        {verificationStatus === 'verified' && (
          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-extrabold text-white/80 cursor-pointer select-none">
              {isAvailable ? 'Disponible' : 'Indisponible'}
            </label>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer flex items-center ${
                isAvailable ? 'bg-ink justify-end' : 'bg-white/20 justify-start'
              }`}
            >
              <span className="w-4.5 h-4.5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        )}
      </div>

      {/* État 1 : Non inscrit / Justificatifs non soumis */}
      {verificationStatus === 'unsubmitted' && (
        <form onSubmit={handleSubmitIdentity} className="card bg-surface p-5 rounded-lg border border-border-warm shadow-warm-1 flex flex-col gap-4">
          <h2 className="font-black text-lg text-ink">Inscription & Vérification d'identité</h2>
          <p className="text-[13.5px] text-ink-muted leading-relaxed">
            Pour devenir Rusher officiel sur la plateforme RUSH et commencer à livrer, veuillez renseigner vos informations de véhicule et fournir vos pièces justificatives obligatoires de sécurité.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11.5px] font-extrabold text-ink-light mb-1.5 ml-1">Type de véhicule</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-bold"
              >
                <option value="moto">Moto de livraison</option>
                <option value="car">Voiture de livraison</option>
                <option value="other">Autre moyen</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[11.5px] font-extrabold text-ink-light mb-1.5 ml-1">Numéro de plaque d'immatriculation</label>
              <input
                type="text"
                required
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="Ex. LT-1234-A"
                className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            <div className="border border-dashed border-border-warm rounded-md p-5 text-center flex flex-col items-center justify-center bg-bg-app-light">
              <span className="text-ink-placeholder"><Icon name="shield" size={26} /></span>
              <div className="font-bold text-[12.5px] text-ink mt-2">Carte Nationale d'Identité (CNI)</div>
              <p className="text-[11px] text-ink-placeholder mt-1">JPG, PNG ou PDF (max 5 Mo)</p>
              <input
                ref={cniInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleDocUpload(e, 'cni')}
              />
              <button
                type="button"
                disabled={uploadingDoc === 'cni'}
                onClick={() => cniInputRef.current?.click()}
                className="mt-3.5 badge bg-ink hover:bg-ink-light text-white font-extrabold text-[11px] px-3 py-1.5 rounded-pill cursor-pointer disabled:opacity-50"
              >
                {uploadingDoc === 'cni' ? 'Upload en cours...' : idCardFile ? `✓ ${idCardFile}` : 'Choisir un fichier'}
              </button>
            </div>

            <div className="border border-dashed border-border-warm rounded-md p-5 text-center flex flex-col items-center justify-center bg-bg-app-light">
              <span className="text-ink-placeholder"><Icon name="pkg" size={26} /></span>
              <div className="font-bold text-[12.5px] text-ink mt-2">Extrait de casier judiciaire (bulletin n°3)</div>
              <p className="text-[11px] text-ink-placeholder mt-1">JPG, PNG ou PDF (&lt; 3 mois, max 5 Mo)</p>
              <input
                ref={casierInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleDocUpload(e, 'casier')}
              />
              <button
                type="button"
                disabled={uploadingDoc === 'casier'}
                onClick={() => casierInputRef.current?.click()}
                className="mt-3.5 badge bg-ink hover:bg-ink-light text-white font-extrabold text-[11px] px-3 py-1.5 rounded-pill cursor-pointer disabled:opacity-50"
              >
                {uploadingDoc === 'casier' ? 'Upload en cours...' : recordFile ? `✓ ${recordFile}` : 'Choisir un fichier'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary h-12 bg-brand text-white font-extrabold text-[13.5px] px-6 rounded-pill shadow-brand cursor-pointer hover:bg-brand-hover active:scale-98 transition-all mt-4 w-full md:w-fit"
          >
            Soumettre ma demande de validation
          </button>
        </form>
      )}

      {/* État 2 : En attente de validation par l'administration */}
      {verificationStatus === 'pending' && (
        <div className="card bg-surface p-6 rounded-lg border border-border-warm shadow-warm-1 text-center flex flex-col items-center max-w-lg mx-auto py-12">
          <span className="w-16 h-16 rounded-full bg-[#FFF1E2] text-[#E2730B] flex items-center justify-center">
            <Icon name="clock" size={32} />
          </span>
          <h2 className="font-black text-lg text-ink mt-4">Vérification en cours</h2>
          <p className="text-[13.5px] text-ink-muted mt-2 leading-relaxed">
            Vos pièces justificatives (CNI et Casier Judiciaire) ont été transmises à l'administration de RUSH. Le processus de validation prend en moyenne 24h à 48h. Vous recevrez une notification d'activation de votre compte de livraison.
          </p>
          
          <button
            onClick={() => setVerificationStatus('verified')}
            className="mt-6 text-[12px] font-extrabold bg-bg-app-light text-ink-light px-3 py-1.5 rounded-pill hover:text-brand transition-colors cursor-pointer"
          >
            Simuler la validation (Démo)
          </button>
        </div>
      )}

      {/* État 3 : Compte Validé - Tableau de bord de livraison */}
      {verificationStatus === 'verified' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-lg text-ink">Courses assignées & Itinéraire Cameroun</h2>
            <button
              type="button"
              onClick={() => setIsGpsBroadcasting((v) => !v)}
              className={`h-9 px-4 rounded-pill text-[12px] font-black cursor-pointer transition-colors flex items-center gap-1.5 ${
                isGpsBroadcasting
                  ? 'bg-success text-white shadow-sm'
                  : 'bg-surface border border-border-warm text-ink hover:border-success'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isGpsBroadcasting ? 'bg-white animate-ping' : 'bg-ink-muted'}`} />
              {isGpsBroadcasting ? 'Diffusion GPS en direct active' : 'Diffuser ma position GPS'}
            </button>
          </div>
          {gpsStatusText && (
            <div className="rounded-md bg-green-tint/45 border border-success/20 px-3.5 py-2 text-[11.5px] font-bold text-success">
              {gpsStatusText}
            </div>
          )}

          {activeOrders.length > 0 && (() => {
            const firstOrder = activeOrders[0];
            const shopLoc = MOCK_SHOPS.find((s) => s.id === firstOrder.shop_id);
            const pLat = shopLoc?.lat ?? 4.0548;
            const pLng = shopLoc?.lng ?? 9.7012;
            const dLoc = resolveLocationFromText(firstOrder.delivery_address);
            const distKm = calculateDistanceKm(pLat, pLng, dLoc.lat, dLoc.lng);
            return (
              <div className="flex flex-col gap-2">
                <CameroonMap
                  center={[pLat, pLng]}
                  zoom={14}
                  fitMarkers
                  useRoadRouting
                  showLayerToggle
                  showLocateButton
                  heightClassName="h-[260px]"
                  interactiveHint={`Mission ${firstOrder.id} · ${distKm} km (${dLoc.cityName})`}
                  markers={[
                    {
                      id: 'rider-pickup',
                      lat: pLat,
                      lng: pLng,
                      title: firstOrder.shop_name || 'Point de retrait',
                      subtitle: shopLoc?.quarter || 'Douala',
                      badge: 'Retrait',
                      variant: 'pickup',
                    },
                    {
                      id: 'rider-dropoff',
                      lat: dLoc.lat,
                      lng: dLoc.lng,
                      title: `Livraison · ${firstOrder.id}`,
                      subtitle: firstOrder.delivery_address,
                      badge: `${distKm} km`,
                      variant: 'dropoff',
                      pulse: true,
                    },
                  ]}
                  routes={[
                    {
                      id: 'rider-mission-route',
                      points: [
                        [pLat, pLng],
                        [dLoc.lat, dLoc.lng],
                      ],
                      color: '#15A05A',
                      dashed: true,
                      weight: 4,
                    },
                  ]}
                />
              </div>
            );
          })()}
          
          {activeOrders.map((o) => {
            const expectedPin = o.delivery_pin || generateDeliveryPin(o.id);
            const enteredPin = pinInputs[o.id] || '';
            return (
              <div key={o.id} className="card bg-surface p-4.5 rounded-lg shadow-warm-1 flex flex-col gap-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-[14.5px] text-ink">{o.id}</span>
                    <span className="text-[12px] text-ink-placeholder font-semibold ml-2">Retrait : {o.shop_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-black text-success">{formatPrice(o.delivery_fee + (o.tip_amount || 0))}</span>
                    <span className="badge bg-brand-tint text-brand font-black text-[11px] px-2 py-0.5 rounded-pill">
                      {o.status === 'preparing' ? 'Prête bientôt' : 'En course'}
                    </span>
                  </div>
                </div>

                <div className="text-[13px] text-ink-light leading-relaxed">
                  <div><strong>Client :</strong> {o.delivery_address}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span><strong>Téléphone :</strong> {o.delivery_phone}</span>
                    <a
                      href={`tel:${o.delivery_phone}`}
                      className="rounded-pill bg-green-tint text-success px-2.5 py-0.5 text-[11px] font-black"
                    >
                      Appeler
                    </a>
                    <a
                      href={`https://wa.me/${o.delivery_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-pill bg-bg-app-light text-ink px-2.5 py-0.5 text-[11px] font-black"
                    >
                      WhatsApp
                    </a>
                  </div>
                  {o.note && <div className="mt-1.5 text-[#E2730B] font-bold bg-[#FFF1E2] p-2 rounded-md border border-[#E2730B]/10">Consigne : "{o.note}"</div>}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mt-1 pt-3 border-t border-border-warm-light">
                  {o.status === 'preparing' ? (
                    <button
                      onClick={() => handleUpdateDelivery(o.id, 'out_for_delivery')}
                      className="flex-1 btn btn-primary h-10 bg-ink text-white font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                    >
                      Récupérer le colis & Démarrer la course
                    </button>
                  ) : o.status === 'out_for_delivery' ? (
                    <>
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredPin}
                        onChange={(e) => setPinInputs((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        placeholder={`PIN client (démo: ${expectedPin})`}
                        className="sm:w-48 bg-bg-app-light border border-border-warm rounded-pill px-3.5 h-10 text-[12.5px] font-black tracking-widest text-ink outline-none focus:ring-2 focus:ring-success"
                      />
                      <button
                        onClick={() => {
                          if (enteredPin.trim() && enteredPin.trim() !== expectedPin) {
                            pushToast(`PIN incorrect (attendu : ${expectedPin})`, 'error');
                            return;
                          }
                          handleUpdateDelivery(o.id, 'delivered');
                        }}
                        className="flex-1 btn btn-primary h-10 bg-success text-white font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                      >
                        Valider la remise (PIN)
                      </button>
                    </>
                  ) : (
                    <div className="text-[12.5px] font-black text-success flex items-center gap-1.5 leading-none py-2">
                      <Icon name="check" size={16} stroke={3} />
                      Livraison effectuée avec succès
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
