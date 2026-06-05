'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, CourierVerificationStatus, Shop } from '@/types';
import { MOCK_ORDERS, MOCK_SHOPS } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [activePanel, setActivePanel] = useState<'orders' | 'couriers' | 'shops'>('orders');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Livreurs simulés à valider
  const [couriers, setCouriers] = useState([
    { id: 'c1', full_name: 'Eric Nkembe', phone: '+237 6 77 11 22 33', status: 'pending' as CourierVerificationStatus, vehicle: 'Moto Yam', id_card: 'cni-back.png', record: 'Casier vierge' },
    { id: 'c2', full_name: 'Brice Tchakounté', phone: '+237 6 99 44 55 66', status: 'pending' as CourierVerificationStatus, vehicle: 'Moto Box', id_card: 'cni-front.png', record: 'Casier vierge' },
  ]);

  // Charger les commandes Supabase
  useEffect(() => {
    async function loadAdminData() {
      try {
        const supabase = createClient();
        
        // Commandes
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (dbOrders && dbOrders.length > 0) {
          const formatted = dbOrders.map((o: any) => ({
            ...o,
            shop_name: MOCK_SHOPS.find(s => s.id === o.shop_id)?.name || 'Boutique Partenaire',
          }));
          setOrders(formatted);
        }

        // Boutiques
        const { data: dbShops } = await supabase.from('shops').select('*');
        if (dbShops && dbShops.length > 0) {
          setShops(dbShops);
        }
      } catch (err) {
        console.warn('Supabase non configuré. Mode simulation actif.');
      }
    }
    loadAdminData();
  }, []);

  // Mettre à jour le statut d'une commande
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      // 1. Essayer Supabase
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (!error) {
        // Enregistrer l'événement de statut
        await supabase.from('order_status_events').insert({
          order_id: orderId,
          status: nextStatus,
          notes: `Statut mis à jour par l'administrateur vers : ${nextStatus}`,
        });
      }
    } catch (err) {
      console.warn('Mise à jour locale uniquement (simulation)');
    }

    // 2. Toujours mettre à jour le state local
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    setIsUpdating(null);
  };

  // Validation d'identité des livreurs
  const handleValidateCourier = (id: string, accept: boolean) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: accept ? 'verified' : 'rejected' } : c))
    );
  };

  // Activer l'abonnement commerçant
  const handleToggleSubscription = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) =>
        s.id === shopId
          ? {
              ...s,
              subscription_status: s.subscription_status === 'active' ? 'none' : 'active',
            }
          : s
      )
    );
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente paiement',
      confirmed: 'Confirmé',
      preparing: 'Préparation',
      out_for_delivery: 'Livraison',
      delivered: 'Livré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-12">
      {/* Header */}
      <div className="border-b border-border-warm-light pb-2">
        <h1 className="font-black text-2xl text-ink tracking-tight flex items-center gap-2">
          Portail Administration RUSH
        </h1>
        <p className="text-[12px] text-ink-placeholder font-semibold mt-1">
          Simulateur de flux de commande, validation d'identité des livreurs et abonnements.
        </p>
      </div>

      {/* Onglets d'administration */}
      <div className="flex gap-2">
        <button
          onClick={() => setActivePanel('orders')}
          className={`flex-1 h-10 rounded-md font-bold text-[13.5px] transition-colors cursor-pointer ${
            activePanel === 'orders' ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
          }`}
        >
          Simulation Commandes
        </button>
        <button
          onClick={() => setActivePanel('couriers')}
          className={`flex-1 h-10 rounded-md font-bold text-[13.5px] transition-colors cursor-pointer ${
            activePanel === 'couriers' ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
          }`}
        >
          Validation Livreurs
        </button>
        <button
          onClick={() => setActivePanel('shops')}
          className={`flex-1 h-10 rounded-md font-bold text-[13.5px] transition-colors cursor-pointer ${
            activePanel === 'shops' ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
          }`}
        >
          Abonnements Boutiques
        </button>
      </div>

      {/* Panel 1 : Simulation des Commandes */}
      {activePanel === 'orders' && (
        <div className="flex flex-col gap-3.5">
          <h2 className="font-black text-lg text-ink">Commandes actives</h2>
          {orders.map((o) => {
            const nextStates: Record<OrderStatus, OrderStatus | null> = {
              pending: 'confirmed',
              confirmed: 'preparing',
              preparing: 'out_for_delivery',
              out_for_delivery: 'delivered',
              delivered: null,
              cancelled: null,
            };
            const next = nextStates[o.status];
            
            return (
              <div key={o.id} className="card bg-surface p-4 rounded-lg shadow-warm-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-[15px] text-ink">{o.id}</span>
                    <span className="text-[12px] text-ink-placeholder font-semibold ml-2">({o.shop_name})</span>
                  </div>
                  <span className="badge bg-brand-tint text-brand font-black text-[11px] px-2 py-0.5 rounded-pill">
                    {getStatusLabel(o.status)}
                  </span>
                </div>

                <div className="text-[12.5px] text-ink-light font-semibold">
                  <div><strong>Total :</strong> {formatPrice(o.total_amount)} | {o.delivery_phone}</div>
                  <div className="mt-1"><strong>Adresse :</strong> Quartier {o.delivery_address}</div>
                </div>

                <div className="flex gap-2 mt-2 pt-3 border-t border-border-warm-light">
                  {next && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, next)}
                      disabled={isUpdating === o.id}
                      className="btn btn-primary h-9 bg-brand hover:bg-brand-hover text-white text-[12px] font-extrabold px-3 rounded-pill cursor-pointer disabled:bg-brand/50 active:scale-95 transition-transform"
                    >
                      Passer au statut : {getStatusLabel(next)}
                    </button>
                  )}
                  {o.status !== 'delivered' && o.status !== 'cancelled' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                      disabled={isUpdating === o.id}
                      className="btn btn-outline h-9 border border-brand/20 hover:bg-brand-tint text-brand text-[12px] font-extrabold px-3 rounded-pill cursor-pointer active:scale-95 transition-transform"
                    >
                      Annuler la commande
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Panel 2 : Validation des Livreurs */}
      {activePanel === 'couriers' && (
        <div className="flex flex-col gap-3.5">
          <h2 className="font-black text-lg text-ink">Demandes de livreurs en attente</h2>
          {couriers.map((c) => (
            <div key={c.id} className="card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-[15.5px] text-ink">{c.full_name}</div>
                <span className={`badge font-black text-[11px] px-2 py-0.5 rounded-pill ${
                  c.status === 'pending' ? 'bg-amber-tint text-warning' : c.status === 'verified' ? 'bg-green-tint text-success' : 'bg-brand-tint text-brand'
                }`}>
                  {c.status === 'pending' ? 'En attente de validation' : c.status === 'verified' ? 'Identité Validée' : 'Rejeté'}
                </span>
              </div>
              
              <div className="text-[13px] text-ink-light leading-relaxed">
                <div><strong>Téléphone :</strong> {c.phone}</div>
                <div className="mt-1"><strong>Véhicule :</strong> {c.vehicle}</div>
              </div>

              {/* Simulation des fichiers d'identité */}
              <div className="grid grid-cols-2 gap-3.5 mt-2">
                <div className="bg-bg-app-light border border-border-warm rounded-md p-3.5 text-center">
                  <div className="text-[11.5px] text-ink-placeholder font-bold">PIÈCE D'IDENTITÉ (CNI)</div>
                  <span className="inline-block mt-2 text-brand"><Icon name="shield" size={24} /></span>
                  <div className="text-[11px] text-ink-light font-semibold mt-1">{c.id_card}</div>
                </div>
                <div className="bg-bg-app-light border border-border-warm rounded-md p-3.5 text-center">
                  <div className="text-[11.5px] text-ink-placeholder font-bold">CASIER JUDICIAIRE</div>
                  <span className="inline-block mt-2 text-brand"><Icon name="pkg" size={24} /></span>
                  <div className="text-[11px] text-ink-light font-semibold mt-1">{c.record}</div>
                </div>
              </div>

              {c.status === 'pending' && (
                <div className="flex gap-3.5 mt-3 pt-3 border-t border-border-warm-light">
                  <button
                    onClick={() => handleValidateCourier(c.id, true)}
                    className="flex-1 btn btn-primary h-9.5 bg-success hover:bg-success-tint/20 text-white font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                  >
                    Valider le livreur
                  </button>
                  <button
                    onClick={() => handleValidateCourier(c.id, false)}
                    className="flex-1 btn btn-outline h-9.5 border border-brand/20 hover:bg-brand-tint text-brand font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panel 3 : Abonnements Commerçants */}
      {activePanel === 'shops' && (
        <div className="flex flex-col gap-3.5">
          <h2 className="font-black text-lg text-ink">Abonnements des boutiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((s) => (
              <div key={s.id} className="card bg-surface p-4.5 rounded-lg shadow-warm-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[15.5px] text-ink">{s.name}</span>
                    <span className={`badge font-black text-[11px] px-2 py-0.5 rounded-pill ${
                      s.subscription_status === 'active' ? 'bg-green-tint text-success' : 'bg-brand-tint text-brand'
                    }`}>
                      {s.subscription_status === 'active' ? 'Abonnement Actif' : 'Non abonné'}
                    </span>
                  </div>
                  <div className="text-[12.5px] text-ink-muted font-semibold mt-1">
                    Formule : Standard Mensuel (15 000 FCFA/mois)
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-border-warm-light mt-2">
                  <span className="text-[11.5px] text-ink-placeholder font-bold">
                    {s.subscription_status === 'active' ? 'Expire le : 30 juin 2026' : 'Aucune date'}
                  </span>
                  <button
                    onClick={() => handleToggleSubscription(s.id)}
                    className={`btn h-8.5 px-3 rounded-pill text-[12px] font-extrabold cursor-pointer active:scale-95 transition-transform ${
                      s.subscription_status === 'active'
                        ? 'border border-brand/20 text-brand bg-brand-tint'
                        : 'bg-ink text-white'
                    }`}
                  >
                    {s.subscription_status === 'active' ? 'Suspendre' : 'Activer abonnement'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
