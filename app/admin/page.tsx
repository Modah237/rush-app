'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, CourierVerificationStatus, Shop } from '@/types';
import { MOCK_ORDERS, MOCK_SHOPS, MOCK_PRODUCTS } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [shops, setShops] = useState<Shop[]>(MOCK_SHOPS);
  const [activePanel, setActivePanel] = useState<'orders' | 'couriers' | 'shops'>('orders');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Drawers and Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dbMode, setDbMode] = useState<'live' | 'simulated'>('simulated');

  // Mock couriers to validate
  const [couriers, setCouriers] = useState([
    { id: 'c1', full_name: 'Eric Nkembe', phone: '+237 6 77 11 22 33', status: 'pending' as CourierVerificationStatus, vehicle: 'Moto Yamaha', id_card: 'cni-back.png', record: 'Casier judiciaire vierge (Bulletin N°3)' },
    { id: 'c2', full_name: 'Brice Tchakounté', phone: '+237 6 99 44 55 66', status: 'pending' as CourierVerificationStatus, vehicle: 'Moto Boxeur', id_card: 'cni-front.png', record: 'Casier judiciaire vierge (Bulletin N°3)' },
    { id: 'c3', full_name: 'Francis Eto\'o', phone: '+237 6 81 23 45 67', status: 'verified' as CourierVerificationStatus, vehicle: 'Moto Boxeur', id_card: 'cni-front-eto.png', record: 'Casier judiciaire vierge (Bulletin N°3)' }
  ]);

  // Load orders and shops from Supabase
  useEffect(() => {
    async function loadAdminData() {
      try {
        const supabase = createClient();
        
        // Commandes
        const { data: dbOrders, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (dbOrders && dbOrders.length > 0 && !orderError) {
          const formatted = dbOrders.map((o: any) => ({
            ...o,
            shop_name: MOCK_SHOPS.find(s => s.id === o.shop_id)?.name || 'Boutique Partenaire',
          }));
          setOrders(formatted);
          setDbMode('live');
        }

        // Boutiques
        const { data: dbShops, error: shopError } = await supabase.from('shops').select('*');
        if (dbShops && dbShops.length > 0 && !shopError) {
          setShops(dbShops);
          setDbMode('live');
        }
      } catch (err) {
        console.warn('Supabase non configuré ou hors ligne. Mode simulation local actif.');
        setDbMode('simulated');
      }
    }
    loadAdminData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Update order status
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setIsUpdating(orderId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (!error) {
        await supabase.from('order_status_events').insert({
          order_id: orderId,
          status: nextStatus,
          notes: `Statut mis à jour par l'administrateur vers : ${nextStatus}`,
        });
        triggerToast(`Statut de la commande ${orderId} mis à jour !`);
      }
    } catch (err) {
      triggerToast(`[Simulé] Commande ${orderId} passée à : ${getStatusLabel(nextStatus)}`);
    }

    // Always update local state
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    
    // Update selectedOrder if open in drawer
    setSelectedOrder((prev) => prev && prev.id === orderId ? { ...prev, status: nextStatus } : prev);
    setIsUpdating(null);
  };

  // Courier validation
  const handleValidateCourier = (id: string, accept: boolean) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: accept ? 'verified' : 'rejected' } : c))
    );
    const courier = couriers.find(c => c.id === id);
    triggerToast(`Livreur ${courier?.full_name} : ${accept ? 'VALIDÉ' : 'REJETÉ'}`);
    setSelectedCourier(null);
  };

  // Toggle merchant subscription
  const handleToggleSubscription = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => {
        if (s.id === shopId) {
          const isActive = s.subscription_status === 'active';
          triggerToast(`Boutique ${s.name} : ${isActive ? 'ABONNEMENT SUSPENDU' : 'ABONNEMENT ACTIVÉ'}`);
          return {
            ...s,
            subscription_status: isActive ? 'none' : 'active',
          };
        }
        return s;
      })
    );
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmé',
      preparing: 'En préparation',
      out_for_delivery: 'En livraison',
      delivered: 'Livré',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-[#FFF6D6] text-[#C79A00]',
      confirmed: 'bg-[#FFF1E2] text-[#E2730B]',
      preparing: 'bg-[#FFF1E2] text-[#E2730B]',
      out_for_delivery: 'bg-[#E8F1FF] text-[#2563EB]',
      delivered: 'bg-[#E6F6EC] text-[#15A05A]',
      cancelled: 'bg-[#FFE9EB] text-[#F50012]',
    };
    return colors[status] || 'bg-bg-app-light text-ink-light';
  };

  // KPI Calculations
  const activeOrdersList = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = activeOrdersList.reduce((sum, o) => sum + o.total_amount, 0);
  const totalCommissions = activeOrdersList.reduce((sum, o) => {
    const comm = Math.round(o.subtotal * 0.10) + Math.round(o.delivery_fee * 0.20);
    return sum + comm;
  }, 0);
  const activeMerchantsCount = shops.filter(s => s.subscription_status === 'active').length;
  const verifiedCouriersCount = couriers.filter(c => c.status === 'verified').length;

  // Filter orders based on filter states
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery_phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page-enter flex flex-col gap-6 px-4 md:px-0 mt-5 pb-16 max-w-5xl mx-auto w-full relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-ink text-white font-extrabold text-[13px] px-5 py-3.5 rounded-lg shadow-warm-3 flex items-center gap-2.5 border border-white/10 animate-fade-in">
          <span className="text-success"><Icon name="check" size={17} stroke={3} /></span>
          {toastMessage}
        </div>
      )}

      {/* Header Admin */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-warm pb-4">
        <div>
          <h1 className="font-black text-2xl md:text-3xl text-ink tracking-tight flex items-center gap-2">
            Console de Supervision RUSH
          </h1>
          <p className="text-[12.5px] text-ink-light font-semibold mt-1">
            Supervisez les commandes, validez les livreurs et pilotez les abonnements partenaires à Douala.
          </p>
        </div>

        {/* DB Sync Indicator */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-surface px-3 py-1.5 rounded-pill border border-border-warm-light shadow-warm-1 text-[11px] font-black">
          <span className={`w-2.5 h-2.5 rounded-full ${dbMode === 'live' ? 'bg-success animate-pulse' : 'bg-[#E2730B]'}`} />
          <span className={dbMode === 'live' ? 'text-success' : 'text-[#E2730B]'}>
            {dbMode === 'live' ? 'Synchro Supabase Active' : 'Mode Simulation Local'}
          </span>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Revenu total */}
        <div className="card bg-surface p-4.5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-ink-muted uppercase tracking-wider">Volume d'affaires</span>
            <span className="text-brand bg-brand-tint/60 p-2 rounded-lg"><Icon name="wallet" size={18} /></span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-ink leading-none">{formatPrice(totalRevenue)}</div>
            <div className="text-[10.5px] text-ink-placeholder font-bold mt-1.5">Commandes confirmées</div>
          </div>
        </div>

        {/* KPI 2 : Commissions */}
        <div className="card bg-surface p-4.5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-ink-muted uppercase tracking-wider">Commissions RUSH</span>
            <span className="text-success bg-[#E6F6EC] p-2 rounded-lg"><Icon name="percent" size={18} /></span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-success leading-none">{formatPrice(totalCommissions)}</div>
            <div className="text-[10.5px] text-ink-placeholder font-bold mt-1.5">10% Boutiques · 20% Livr.</div>
          </div>
        </div>

        {/* KPI 3 : Commerçants */}
        <div className="card bg-surface p-4.5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-ink-muted uppercase tracking-wider">Boutiques Abonnées</span>
            <span className="text-info bg-info/10 p-2 rounded-lg"><Icon name="bag" size={18} /></span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-ink leading-none">{activeMerchantsCount} actives</div>
            <div className="text-[10.5px] text-ink-placeholder font-bold mt-1.5">Boutiques partenaires</div>
          </div>
        </div>

        {/* KPI 4 : Livreurs */}
        <div className="card bg-surface p-4.5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-ink-muted uppercase tracking-wider">Rushers Validés</span>
            <span className="text-warning bg-amber-tint p-2 rounded-lg"><Icon name="truck" size={18} /></span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-ink leading-none">{verifiedCouriersCount} livreurs</div>
            <div className="text-[10.5px] text-ink-placeholder font-bold mt-1.5">Dossiers CNI approuvés</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-bg-app-light p-1.5 rounded-xl border border-border-warm-light">
        <button
          onClick={() => setActivePanel('orders')}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg font-black text-[13.5px] cursor-pointer transition-all ${
            activePanel === 'orders' ? 'bg-surface text-ink shadow-warm-1' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Icon name="pkg" size={16} />
          Simulation des Commandes ({orders.length})
        </button>
        <button
          onClick={() => setActivePanel('couriers')}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg font-black text-[13.5px] cursor-pointer transition-all ${
            activePanel === 'couriers' ? 'bg-surface text-ink shadow-warm-1' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Icon name="shield" size={16} />
          Validation des Livreurs ({couriers.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setActivePanel('shops')}
          className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg font-black text-[13.5px] cursor-pointer transition-all ${
            activePanel === 'shops' ? 'bg-surface text-ink shadow-warm-1' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Icon name="bag" size={16} />
          Abonnements Boutiques ({shops.length})
        </button>
      </div>

      {/* Panel 1 : Simulation des Commandes */}
      {activePanel === 'orders' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <h2 className="font-black text-lg text-ink self-start md:self-auto">Commandes en transit</h2>
            
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex items-center bg-surface rounded-md px-3.5 h-10 border border-border-warm-light focus-within:ring-1 focus-within:ring-brand w-full sm:w-60">
                <Icon name="search" size={15} className="text-ink-placeholder" />
                <input 
                  type="text"
                  placeholder="ID, boutique ou tél..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-semibold text-[13px] ml-2 text-ink"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface border border-border-warm-light rounded-md px-3.5 h-10 outline-none text-ink font-bold text-[12.5px] cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="preparing">Préparation</option>
                <option value="out_for_delivery">En livraison</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>

          {/* Table list of orders */}
          <div className="card bg-surface border border-border-warm-light rounded-xl overflow-hidden shadow-warm-1">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                  <tr className="bg-bg-app-light border-b border-border-warm-light text-ink-muted font-extrabold">
                    <th className="p-4">ID Commande</th>
                    <th className="p-4">Boutique</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Client</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-warm-light/40">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-ink-placeholder font-semibold">
                        Aucune commande ne correspond aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
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
                        <tr 
                          key={o.id} 
                          onClick={() => setSelectedOrder(o)}
                          className="hover:bg-bg-app-light/30 cursor-pointer transition-colors"
                        >
                          <td className="p-4 font-black text-ink">{o.id}</td>
                          <td className="p-4 font-bold text-ink-light">{o.shop_name}</td>
                          <td className="p-4 font-black text-ink">{formatPrice(o.total_amount)}</td>
                          <td className="p-4 font-medium text-ink-light">
                            <div>Douala · {o.delivery_address}</div>
                            <div className="text-[11px] text-ink-placeholder mt-0.5">{o.delivery_phone}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 rounded-pill text-[10.5px] font-black leading-none ${getStatusColor(o.status)}`}>
                              {getStatusLabel(o.status)}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              {next && (
                                <button
                                  onClick={() => handleUpdateStatus(o.id, next)}
                                  disabled={isUpdating === o.id}
                                  className="btn btn-primary h-8 bg-ink hover:bg-brand text-white text-[11px] font-black px-3 rounded-pill cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                                >
                                  {isUpdating === o.id ? '...' : `→ ${getStatusLabel(next)}`}
                                </button>
                              )}
                              {o.status !== 'delivered' && o.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                                  disabled={isUpdating === o.id}
                                  className="btn btn-outline h-8 border border-brand/20 hover:bg-brand-tint text-brand text-[11px] font-bold px-3 rounded-pill cursor-pointer disabled:opacity-50 transition-all active:scale-95"
                                >
                                  Annuler
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="w-8 h-8 rounded-full bg-bg-app-light text-ink hover:bg-border-warm flex items-center justify-center transition-colors"
                                title="Inspecter"
                              >
                                <Icon name="chevR" size={14} stroke={2.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Panel 2 : Validation des Livreurs */}
      {activePanel === 'couriers' && (
        <div className="flex flex-col gap-4">
          <h2 className="font-black text-lg text-ink">Validation d'identité des livreurs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {couriers.map((c) => (
              <div 
                key={c.id} 
                className="card bg-surface p-5 rounded-xl border border-border-warm shadow-warm-1 flex flex-col gap-4.5 hover:shadow-warm-2 transition-shadow relative overflow-hidden"
              >
                {/* Visual side band decoration */}
                <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.status === 'pending' ? 'bg-[#E2730B]' : c.status === 'verified' ? 'bg-[#15A05A]' : 'bg-[#F50012]'}`} />

                <div className="flex items-start justify-between pl-1">
                  <div>
                    <h3 className="font-extrabold text-[16px] text-ink leading-tight">{c.full_name}</h3>
                    <p className="text-[11.5px] text-ink-placeholder font-bold mt-1">{c.phone}</p>
                  </div>
                  <span className={`badge font-black text-[10.5px] px-2.5 py-1 rounded-pill ${
                    c.status === 'pending' ? 'bg-[#FFF1E2] text-[#E2730B]' : c.status === 'verified' ? 'bg-[#E6F6EC] text-[#15A05A]' : 'bg-[#FFE9EB] text-[#F50012]'
                  }`}>
                    {c.status === 'pending' ? 'À valider' : c.status === 'verified' ? 'Vérifié' : 'Rejeté'}
                  </span>
                </div>

                <div className="text-[12.5px] text-ink-light pl-1 font-semibold leading-relaxed">
                  <div><strong>Moyen de transport :</strong> {c.vehicle}</div>
                  <div className="mt-1"><strong>Extrait Casier :</strong> {c.record}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-1.5 pl-1">
                  <button 
                    onClick={() => setSelectedCourier({ ...c, type: 'cni' })}
                    className="bg-bg-app-light border border-border-warm-light/60 hover:border-brand/20 rounded-lg p-3 text-center transition-colors cursor-pointer group"
                  >
                    <div className="text-[9.5px] text-ink-placeholder font-black uppercase tracking-wider group-hover:text-brand">Pièce d'Identité</div>
                    <span className="inline-block mt-1.5 text-ink-light group-hover:text-brand"><Icon name="shield" size={20} /></span>
                    <div className="text-[10px] text-brand font-bold mt-1 underline">cni-recto-verso.png</div>
                  </button>

                  <button 
                    onClick={() => setSelectedCourier({ ...c, type: 'casier' })}
                    className="bg-bg-app-light border border-border-warm-light/60 hover:border-brand/20 rounded-lg p-3 text-center transition-colors cursor-pointer group"
                  >
                    <div className="text-[9.5px] text-ink-placeholder font-black uppercase tracking-wider group-hover:text-brand">Casier Judiciaire</div>
                    <span className="inline-block mt-1.5 text-ink-light group-hover:text-brand"><Icon name="pkg" size={20} /></span>
                    <div className="text-[10px] text-brand font-bold mt-1 underline">casier-judiciaire.pdf</div>
                  </button>
                </div>

                {c.status === 'pending' && (
                  <div className="flex gap-3.5 mt-2 pt-4 border-t border-border-warm-light/50 pl-1">
                    <button
                      onClick={() => handleValidateCourier(c.id, true)}
                      className="flex-1 btn btn-primary h-10 bg-success text-white font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 hover:opacity-90 transition-transform"
                    >
                      Valider le livreur
                    </button>
                    <button
                      onClick={() => handleValidateCourier(c.id, false)}
                      className="flex-1 btn btn-outline h-10 border border-brand/20 hover:bg-brand-tint text-brand font-extrabold text-[12.5px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel 3 : Abonnements Commerçants */}
      {activePanel === 'shops' && (
        <div className="flex flex-col gap-4">
          <h2 className="font-black text-lg text-ink">Boutiques et Abonnements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shops.map((s) => {
              const isActive = s.subscription_status === 'active';
              return (
                <div key={s.id} className="card bg-surface p-5 rounded-xl border border-border-warm shadow-warm-1 flex flex-col justify-between gap-4 hover:shadow-warm-2 transition-shadow relative overflow-hidden">
                  <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${isActive ? 'bg-[#15A05A]' : 'bg-[#F50012]'}`} />
                  
                  <div className="pl-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-extrabold text-[16px] text-ink leading-tight flex items-center gap-1.5">
                        <span className="w-6.5 h-6.5 rounded bg-bg-app-light flex items-center justify-center text-brand"><Icon name={s.glyph} size={15} /></span>
                        {s.name}
                      </h3>
                      <span className={`badge font-black text-[10.5px] px-2.5 py-1 rounded-pill ${
                        isActive ? 'bg-[#E6F6EC] text-[#15A05A]' : 'bg-[#FFE9EB] text-[#F50012]'
                      }`}>
                        {isActive ? 'Abonnement Actif' : 'Suspendu'}
                      </span>
                    </div>
                    
                    <div className="text-[12.5px] text-ink-muted font-bold mt-2.5">
                      Formule : Starter Mensuel (15 000 FCFA/mois)
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border-warm-light/50 mt-2 pl-1">
                    <span className="text-[11.5px] text-ink-placeholder font-bold flex items-center gap-1">
                      <Icon name="clock" size={13} />
                      {isActive ? 'Expire le : 30 juin 2026' : 'Aucune date d\'expiration'}
                    </span>
                    
                    <button
                      onClick={() => handleToggleSubscription(s.id)}
                      className={`btn h-9 px-4.5 rounded-pill text-[12px] font-black cursor-pointer active:scale-95 transition-all shadow-sm ${
                        isActive
                          ? 'border border-brand/20 text-brand bg-brand-tint hover:bg-brand-tint/80'
                          : 'bg-ink text-white hover:bg-ink-light'
                      }`}
                    >
                      {isActive ? 'Suspendre' : 'Réactiver'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Volet Latéral / Drawer de Détails de la Commande */}
      {selectedOrder && (
        <>
          {/* Overlay flouté */}
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setSelectedOrder(null)} />
          
          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface z-50 shadow-warm-3 flex flex-col justify-between border-l border-border-warm-light animate-sheet-left">
            {/* Header Drawer */}
            <div className="p-5 border-b border-border-warm-light/60 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-ink tracking-tight flex items-center gap-1.5">
                  <Icon name="bag" size={18} className="text-brand" />
                  Détail Commande
                </h3>
                <span className="text-[12px] text-ink-placeholder font-bold mt-0.5 block">{selectedOrder.id}</span>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-full bg-bg-app-light text-ink hover:text-brand flex items-center justify-center cursor-pointer transition-colors"
              >
                <Icon name="x" size={16} stroke={2.5} />
              </button>
            </div>

            {/* Content Drawer */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-[13px] text-ink-light">
              
              {/* Statut actuel */}
              <div className="bg-bg-app-light border border-border-warm-light p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-ink-placeholder font-black uppercase tracking-wider block">Statut Actuel</span>
                  <span className={`inline-block mt-1.5 px-3 py-1 rounded-pill text-[11px] font-black leading-none ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                
                {/* Bouton de progression rapide */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div>
                    <button
                      onClick={() => {
                        const nextStates: Record<OrderStatus, OrderStatus> = {
                          pending: 'confirmed',
                          confirmed: 'preparing',
                          preparing: 'out_for_delivery',
                          out_for_delivery: 'delivered',
                          delivered: 'delivered',
                          cancelled: 'cancelled',
                        };
                        handleUpdateStatus(selectedOrder.id, nextStates[selectedOrder.status]);
                      }}
                      className="btn h-9.5 bg-brand text-white font-extrabold text-[12px] px-3.5 rounded-pill shadow-brand"
                    >
                      Avancer Statut
                    </button>
                  </div>
                )}
              </div>

              {/* Infos Client et Livraison */}
              <div className="flex flex-col gap-2">
                <h4 className="font-extrabold text-[13.5px] text-ink uppercase tracking-wider border-b border-border-warm-light/40 pb-1.5">Livraison</h4>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-ink-placeholder font-bold">Client :</span>
                  <span className="col-span-2 font-black text-ink">{selectedOrder.delivery_phone}</span>
                  
                  <span className="text-ink-placeholder font-bold">Quartier :</span>
                  <span className="col-span-2 font-black text-ink">Douala · {selectedOrder.delivery_address}</span>
                  
                  {selectedOrder.note && (
                    <>
                      <span className="text-ink-placeholder font-bold">Note :</span>
                      <span className="col-span-2 text-[#E2730B] font-bold bg-[#FFF1E2] p-2 rounded border border-[#E2730B]/10">"{selectedOrder.note}"</span>
                    </>
                  )}
                </div>
              </div>

              {/* Répartition Financière */}
              <div className="flex flex-col gap-2">
                <h4 className="font-extrabold text-[13.5px] text-ink uppercase tracking-wider border-b border-border-warm-light/40 pb-1.5">Répartition Financière</h4>
                
                <div className="flex flex-col gap-2 bg-surface p-3.5 rounded-xl border border-border-warm-light shadow-warm-1 mt-1 font-semibold text-ink-light">
                  <div className="flex justify-between">
                    <span>Articles (Commerçant) :</span>
                    <span className="text-ink font-black">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraison (Livreur) :</span>
                    <span className="text-ink font-black">{formatPrice(selectedOrder.delivery_fee)}</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-brand">
                      <span>Remise Promo (RUSH25) :</span>
                      <span className="font-black">-{formatPrice(selectedOrder.discount_amount)}</span>
                    </div>
                  )}
                  
                  <div className="h-[1px] bg-border-warm-light/50 my-1" />
                  
                  <div className="flex justify-between text-[14.5px]">
                    <span className="font-extrabold text-ink">Total final :</span>
                    <span className="font-black text-ink">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>

                  <div className="h-[1px] bg-border-warm-light/50 my-1" />

                  {/* Platform calculations */}
                  <div className="text-[11.5px] leading-relaxed flex flex-col gap-1.5 pt-1.5">
                    <div className="flex justify-between text-success">
                      <span>Commission RUSH (10% prod + 20% livr) :</span>
                      <span className="font-black">+{formatPrice(Math.round(selectedOrder.subtotal * 0.10) + Math.round(selectedOrder.delivery_fee * 0.20))}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Part Commerçant (90% prod) :</span>
                      <span className="font-black">{formatPrice(Math.round(selectedOrder.subtotal * 0.90))}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Part Livreur (80% livr) :</span>
                      <span className="font-black">{formatPrice(Math.round(selectedOrder.delivery_fee * 0.80))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Drawer */}
            <div className="p-5 border-t border-border-warm-light/60 bg-bg-app-light/30 flex gap-3">
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  className="flex-1 btn h-11 border border-brand text-brand font-black rounded-pill bg-white hover:bg-brand-tint active:scale-95"
                >
                  Annuler la commande
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 btn h-11 bg-ink text-white font-black rounded-pill hover:bg-ink-light active:scale-95"
              >
                Fermer
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modale d'Inspection des justificatifs d'identité des livreurs */}
      {selectedCourier && (
        <>
          <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setSelectedCourier(null)} />
          
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface z-51 rounded-2xl shadow-warm-3 p-5 flex flex-col gap-4.5 border border-border-warm-light animate-scale-up">
            <div className="flex items-center justify-between border-b border-border-warm-light/50 pb-3">
              <div>
                <h3 className="font-black text-lg text-ink flex items-center gap-1.5">
                  <Icon name="shield" size={18} className="text-brand" />
                  Inspection Document : {selectedCourier.type === 'cni' ? 'CNI' : 'Casier Judiciaire'}
                </h3>
                <p className="text-[11.5px] text-ink-placeholder font-bold mt-0.5">{selectedCourier.full_name}</p>
              </div>
              <button 
                onClick={() => setSelectedCourier(null)}
                className="w-8 h-8 rounded-full bg-bg-app-light text-ink hover:text-brand flex items-center justify-center cursor-pointer transition-colors"
              >
                <Icon name="x" size={14} stroke={2.5} />
              </button>
            </div>

            {/* Document display */}
            <div className="p-4 bg-[#faf8f6] border border-border-warm rounded-xl min-h-[220px] flex flex-col items-center justify-center text-center select-none relative overflow-hidden">
              
              {selectedCourier.type === 'cni' ? (
                // Mock CNI graphic
                <div className="w-[340px] h-[190px] rounded-lg bg-gradient-to-tr from-[#EAF1EC] to-[#E8F1FF] border border-[#2563EB]/15 p-4 flex flex-col justify-between shadow-warm-1 text-left font-sans text-ink relative">
                  {/* CNI Header */}
                  <div className="flex justify-between items-start text-[#2563EB] border-b border-[#2563EB]/10 pb-1.5">
                    <span className="text-[10px] font-black uppercase">République du Cameroun</span>
                    <span className="text-[9px] font-bold">National Identity Card</span>
                  </div>
                  {/* CNI Info */}
                  <div className="flex gap-3.5 my-2">
                    <div className="w-16 h-20 rounded bg-ink-placeholder/20 border border-ink-placeholder/10 flex items-center justify-center text-ink-muted">
                      <Icon name="user" size={32} />
                    </div>
                    <div className="text-[10px] leading-tight flex-1 flex flex-col gap-1.5">
                      <div><strong>Nom :</strong> {selectedCourier.full_name.split(' ')[1]}</div>
                      <div><strong>Prénom :</strong> {selectedCourier.full_name.split(' ')[0]}</div>
                      <div><strong>Né le :</strong> 12/04/1995 à Douala</div>
                      <div><strong>Téléphone :</strong> {selectedCourier.phone}</div>
                    </div>
                  </div>
                  {/* CNI Footer */}
                  <div className="text-[9px] text-ink-placeholder font-bold flex justify-between">
                    <span>ID : CNI-237-920492-MK</span>
                    <span>Expire le : 18/09/2030</span>
                  </div>
                </div>
              ) : (
                // Mock Criminal Record (Casier judiciaire)
                <div className="w-[300px] h-[200px] rounded bg-white border border-border-warm p-4 flex flex-col justify-between shadow-warm-1 text-left font-serif text-ink relative">
                  {/* Record Header */}
                  <div className="text-center border-b-2 border-double border-ink/40 pb-2">
                    <span className="text-[10px] font-black uppercase block tracking-wider">Ministère de la Justice</span>
                    <span className="text-[8px] font-bold uppercase text-ink-muted block mt-0.5">Extrait de Casier Judiciaire</span>
                  </div>
                  {/* Record Info */}
                  <div className="text-[10px] leading-normal my-2.5 flex flex-col gap-1 pl-1">
                    <div>Le Procureur de la République près le tribunal de Douala certifie que le casier judiciaire du nommé :</div>
                    <div className="font-extrabold text-[11px] mt-1">M. {selectedCourier.full_name.toUpperCase()}</div>
                    <div className="mt-1 text-success font-black uppercase text-[10px] tracking-wide flex items-center gap-1">
                      <Icon name="check" size={12} stroke={3.5} />
                      Néant (Bulletin N°3 Vierge)
                    </div>
                  </div>
                  {/* Record Footer */}
                  <div className="text-[8px] text-ink-placeholder font-sans font-bold flex justify-between border-t border-[#faf8f6] pt-1.5">
                    <span>Fait à Douala, le 15/05/2026</span>
                    <span>Signé : Greffier</span>
                  </div>
                </div>
              )}

            </div>

            {/* Quick Actions inside modal */}
            {selectedCourier.status === 'pending' && (
              <div className="flex gap-3.5 mt-2.5 pt-3.5 border-t border-border-warm-light/50">
                <button
                  onClick={() => handleValidateCourier(selectedCourier.id, true)}
                  className="flex-1 btn h-11 bg-success text-white font-extrabold text-[13px] rounded-pill cursor-pointer active:scale-95 transition-transform"
                >
                  Approuver le document
                </button>
                <button
                  onClick={() => handleValidateCourier(selectedCourier.id, false)}
                  className="flex-1 btn h-11 border border-brand text-brand font-extrabold text-[13px] rounded-pill bg-white hover:bg-brand-tint active:scale-95 transition-transform"
                >
                  Rejeter le document
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
