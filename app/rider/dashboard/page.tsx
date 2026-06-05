'use client';

import React, { useState } from 'react';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import Link from 'next/link';

export default function RiderDashboardPage() {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'unsubmitted'>('unsubmitted');
  const [isAvailable, setIsAvailable] = useState(false);
  const [activeOrders, setActiveOrders] = useState<Order[]>(
    MOCK_ORDERS.filter((o) => o.status === 'out_for_delivery')
  );

  // Formulaire d'identité
  const [vehicleType, setVehicleType] = useState('moto');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [idCardFile, setIdCardFile] = useState<string | null>(null);
  const [recordFile, setRecordFile] = useState<string | null>(null);

  const handleSubmitIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationStatus('pending');
  };

  const handleUpdateDelivery = (orderId: string, status: OrderStatus) => {
    setActiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
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
              <p className="text-[11px] text-ink-placeholder mt-1">Fournir un scan recto-verso lisible.</p>
              <button 
                type="button"
                onClick={() => setIdCardFile('cni-scan.png')}
                className="mt-3.5 badge bg-ink hover:bg-ink-light text-white font-extrabold text-[11px] px-3 py-1.5 rounded-pill cursor-pointer"
              >
                {idCardFile ? 'CNI Chargée' : 'Uploader fichier'}
              </button>
            </div>

            <div className="border border-dashed border-border-warm rounded-md p-5 text-center flex flex-col items-center justify-center bg-bg-app-light">
              <span className="text-ink-placeholder"><Icon name="pkg" size={26} /></span>
              <div className="font-bold text-[12.5px] text-ink mt-2">Extrait de casier judiciaire (bulletin n°3)</div>
              <p className="text-[11px] text-ink-placeholder mt-1">Fournir un extrait datant de moins de 3 mois.</p>
              <button 
                type="button"
                onClick={() => setRecordFile('casier.pdf')}
                className="mt-3.5 badge bg-ink hover:bg-ink-light text-white font-extrabold text-[11px] px-3 py-1.5 rounded-pill cursor-pointer"
              >
                {recordFile ? 'Casier Chargé' : 'Uploader fichier'}
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
          <h2 className="font-black text-lg text-ink">Courses assignées</h2>
          
          {activeOrders.map((o) => (
            <div key={o.id} className="card bg-surface p-4.5 rounded-lg shadow-warm-1 flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-black text-[14.5px] text-ink">{o.id}</span>
                  <span className="text-[12px] text-ink-placeholder font-semibold ml-2">Point de retrait : {o.shop_name}</span>
                </div>
                <span className="badge bg-brand-tint text-brand font-black text-[11px] px-2 py-0.5 rounded-pill">
                  {o.status}
                </span>
              </div>

              <div className="text-[13px] text-ink-light leading-relaxed">
                <div><strong>Adresse du Client :</strong> Quartier {o.delivery_address}</div>
                <div className="mt-0.5"><strong>Téléphone :</strong> {o.delivery_phone}</div>
                {o.note && <div className="mt-1.5 text-[#E2730B] font-bold bg-[#FFF1E2] p-2 rounded-md border border-[#E2730B]/10">Note : "{o.note}"</div>}
              </div>

              <div className="flex gap-3.5 mt-2 pt-3 border-t border-border-warm-light">
                {o.status === 'out_for_delivery' ? (
                  <button
                    onClick={() => handleUpdateDelivery(o.id, 'delivered')}
                    className="flex-1 btn btn-primary h-10 bg-success text-white font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                  >
                    Valider la livraison (Remise au client)
                  </button>
                ) : (
                  <div className="text-[12.5px] font-black text-success flex items-center gap-1.5 leading-none py-2">
                    <Icon name="check" size={16} stroke={3} />
                    Livraison effectuée avec succès
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
