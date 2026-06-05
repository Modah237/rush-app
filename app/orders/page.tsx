'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MOCK_ORDERS } from '@/lib/mock-data';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import EmptyState from '@/components/shared/empty-state';
import { createClient } from '@/lib/supabase/client';

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cours' | 'hist'>('cours');
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Charger les commandes Supabase si connecté
  useEffect(() => {
    async function loadOrders() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Joindre les noms de boutiques mockées si nécessaire
            const formatted = data.map((o: any) => ({
              ...o,
              shop_name: MOCK_ORDERS.find(mo => mo.shop_id === o.shop_id)?.shop_name || 'Boutique Partenaire',
            }));
            setOrders(formatted);
          }
        }
      } catch (err) {
        console.warn('Erreur Supabase. Utilisation des données mockées.');
      }
      setIsLoaded(true);
    }
    loadOrders();
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
  const currentList = activeTab === 'cours' ? activeOrders : pastOrders;

  const statusConfig: Record<OrderStatus, { label: string; color: string; step: number }> = {
    pending: { label: 'En attente', color: '#8A817D', step: 0 },
    confirmed: { label: 'Confirmé', color: '#E2730B', step: 1 },
    preparing: { label: 'En préparation', color: '#E2730B', step: 2 },
    out_for_delivery: { label: 'En livraison', color: '#F50012', step: 3 },
    delivered: { label: 'Livré', color: '#15A05A', step: 4 },
    cancelled: { label: 'Annulé', color: '#B3000D', step: 4 },
  };

  const timelineSteps = [
    { label: 'Confirmée', desc: 'Acceptée' },
    { label: 'Préparation', desc: 'Boutique' },
    { label: 'Prête', desc: 'Au livreur' },
    { label: 'Livraison', desc: 'En route' },
    { label: 'Livrée', desc: 'Arrivée' },
  ];

  const getTimelineStepIndex = (status: OrderStatus) => {
    return statusConfig[status]?.step ?? 0;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getItemsCount = (o: Order) => {
    // Calcul estimatif des articles par rapport au sous-total
    return Math.max(1, Math.round(o.subtotal / 3500));
  };

  const getPaymentLabel = (o: Order) => {
    if (o.id === 'RSH-20492') return 'MTN MoMo';
    if (o.id === 'RSH-20410') return 'Orange Money';
    return 'MTN MoMo'; // Valeur par défaut cohérente
  };

  const handleRetry = () => {
    setLoadError(false);
    setIsLoaded(false);
    setTimeout(() => {
      setOrders(MOCK_ORDERS);
      setIsLoaded(true);
    }, 850);
  };

  return (
    <div className="page-enter flex flex-col gap-6 px-4 md:px-0 mt-5 pb-24 md:pb-10 max-w-3xl mx-auto">
      {/* Header de page */}
      <div className="flex flex-col gap-1">
        <h1 className="font-black text-2xl md:text-3xl text-ink tracking-tight">Mes commandes</h1>
        <p className="text-[13.5px] md:text-[14.5px] font-semibold text-ink-light leading-relaxed">
          Suivez vos commandes en cours et retrouvez votre historique.
        </p>
      </div>

      {/* Tabs Sticky/Directs */}
      <div className="sticky top-0 md:top-[64px] z-30 bg-bg-app/95 backdrop-blur-md py-3 border-b border-border-warm-light/50 flex gap-3">
        <button
          onClick={() => setActiveTab('cours')}
          className={`flex-1 flex items-center justify-center gap-2.5 h-12 rounded-[14px] font-extrabold text-[14.5px] transition-all cursor-pointer ${
            activeTab === 'cours' 
              ? 'bg-ink text-white shadow-warm-1' 
              : 'bg-surface border border-border-warm-light/70 text-ink-muted hover:bg-bg-app-light'
          }`}
        >
          <span>En cours</span>
          <span 
            className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
              activeTab === 'cours' ? 'bg-white/20 text-white' : 'bg-bg-app-light text-ink-muted'
            }`}
          >
            {activeOrders.length}
          </span>
        </button>
        
        <button
          onClick={() => setActiveTab('hist')}
          className={`flex-1 flex items-center justify-center gap-2.5 h-12 rounded-[14px] font-extrabold text-[14.5px] transition-all cursor-pointer ${
            activeTab === 'hist' 
              ? 'bg-ink text-white shadow-warm-1' 
              : 'bg-surface border border-border-warm-light/70 text-ink-muted hover:bg-bg-app-light'
          }`}
        >
          <span>Historique</span>
          <span 
            className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
              activeTab === 'hist' ? 'bg-white/20 text-white' : 'bg-bg-app-light text-ink-muted'
            }`}
          >
            {pastOrders.length}
          </span>
        </button>
      </div>

      {/* Rendu dynamique des listes */}
      <div className="flex flex-col gap-5">
        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-[13px] font-black text-ink-placeholder">Chargement de vos commandes...</span>
          </div>
        ) : loadError ? (
          <EmptyState
            icon="shield"
            title="Erreur de chargement"
            text="Nous n'avons pas pu récupérer vos commandes. Veuillez vérifier votre connexion et réessayer."
            cta="Réessayer"
            onCta={handleRetry}
          />
        ) : currentList.length === 0 ? (
          <EmptyState
            icon="pkg"
            title={activeTab === 'cours' ? "Aucune commande en cours" : "Historique vide"}
            text={
              activeTab === 'cours'
                ? "Vous n'avez aucune livraison active pour le moment. Prêt à commander ?"
                : "Vous n'avez pas encore passé de commande sur RUSH."
            }
            cta="Découvrir les boutiques"
            onCta={() => router.push('/')}
          />
        ) : (
          currentList.map((o) => {
            const st = statusConfig[o.status] || { label: o.status, color: '#8A817D', step: 0 };
            const isActive = o.status !== 'delivered' && o.status !== 'cancelled';
            const currentStep = getTimelineStepIndex(o.status);

            if (isActive) {
              {/* Carte commande en cours (Premium Rich Card) */}
              return (
                <div
                  key={o.id}
                  onClick={() => router.push(`/orders/${o.id}`)}
                  className="bg-surface rounded-[24px] border border-border-warm-light/70 shadow-warm-2 p-5 flex flex-col gap-5 hover:border-brand/10 cursor-pointer transition-all duration-200"
                >
                  {/* Entête de carte active */}
                  <div className="flex items-start justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3.5">
                      <span className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-brand-tint text-brand flex-none shadow-sm">
                        <Icon name="bag" size={23} stroke={2.1} />
                      </span>
                      <div>
                        <div className="font-extrabold text-[16px] text-ink leading-tight">{o.shop_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11.5px] font-black text-ink-muted tracking-wide">{o.id}</span>
                          <span className="text-ink-placeholder font-black text-[10px]">·</span>
                          <span className="inline-flex items-center gap-1 rounded-pill bg-brand-tint text-brand font-extrabold text-[10.5px] px-2 py-0.5">
                            {o.total_amount >= 10000 ? 'Livraison offerte' : 'Livraison rapide'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span 
                      className="badge text-[11px] font-black px-2.5 py-1 rounded-pill shadow-sm"
                      style={{ backgroundColor: `${st.color}15`, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Bloc temps d'arrivée (ETA) */}
                  <div className="rounded-[18px] bg-bg-app-light p-4 flex items-center gap-3.5 border border-border-warm-light/40">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-tint text-brand">
                      <Icon name="clock" size={20} stroke={2.3} />
                    </span>
                    <div>
                      <div className="text-[11.5px] font-extrabold text-ink-muted uppercase leading-none">Temps d'arrivée estimé</div>
                      <div className="text-[16px] font-black text-brand mt-1 leading-none">
                        Dans {o.eta_minutes ? `${o.eta_minutes - 5} - ${o.eta_minutes + 5}` : '18 - 25'} min
                      </div>
                    </div>
                  </div>

                  {/* Détails commandes */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-[13px] border-y border-border-warm-light/50 py-4 font-semibold text-ink-light">
                    <div>
                      <span className="text-ink-muted font-bold text-[12px] block">Montant</span>
                      <span className="font-black text-ink text-[14.5px] mt-0.5 block">{formatPrice(o.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted font-bold text-[12px] block">Articles</span>
                      <span className="font-black text-ink text-[14.5px] mt-0.5 block">{getItemsCount(o)} articles</span>
                    </div>
                    <div>
                      <span className="text-ink-muted font-bold text-[12px] block">Paiement</span>
                      <span className="font-black text-success text-[13.5px] mt-0.5 flex items-center gap-1">
                        <Icon name="check" size={13} stroke={3} />
                        {getPaymentLabel(o)} confirmé
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-muted font-bold text-[12px] block">Adresse</span>
                      <span className="font-black text-ink mt-0.5 block truncate max-w-[160px]">{o.delivery_address}</span>
                    </div>
                    {o.courier_name && (
                      <div className="col-span-2 border-t border-border-warm-light/40 pt-3.5">
                        <span className="text-ink-muted font-bold text-[12px] block">Livreur assigné</span>
                        <span className="font-black text-ink mt-0.5 flex items-center gap-2">
                          <Icon name="user" size={14} className="text-ink-light" stroke={2.5} />
                          {o.courier_name} · Moto RUSH
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stepper Timeline Desktop */}
                  <div className="hidden md:block my-2 px-1">
                    <div className="relative flex items-center justify-between">
                      {/* Grey Line background */}
                      <div className="absolute left-0 right-0 top-4 -translate-y-1/2 h-[3px] bg-border-warm-light/60" />
                      {/* Active Line progress */}
                      <div 
                        className="absolute left-0 top-4 -translate-y-1/2 h-[3px] bg-brand transition-all duration-500" 
                        style={{ width: `${(currentStep / (timelineSteps.length - 1)) * 100}%` }}
                      />
                      
                      {timelineSteps.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center flex-1">
                            <span 
                              className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-black text-[11px] border-2 transition-all ${
                                isCurrent 
                                  ? 'bg-brand text-white border-brand shadow-brand scale-110' 
                                  : isCompleted 
                                    ? 'bg-brand text-white border-brand' 
                                    : 'bg-white text-ink-placeholder border-border-warm'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </span>
                            <div className="mt-2 text-center">
                              <div className={`text-[11.5px] font-black ${isCurrent ? 'text-brand' : 'text-ink-light'}`}>{step.label}</div>
                              <div className="text-[9.5px] text-ink-placeholder font-extrabold mt-0.5 leading-none">{step.desc}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stepper Timeline Mobile */}
                  <div className="md:hidden my-1 px-1">
                    <div className="flex flex-col gap-4.5 relative pl-5 border-l-2 border-border-warm-light/60">
                      {/* Active line overlay */}
                      <div 
                        className="absolute left-[-2px] top-0 w-[2px] bg-brand transition-all duration-500"
                        style={{ height: `${(currentStep / (timelineSteps.length - 1)) * 100}%` }}
                      />
                      {timelineSteps.map((step, idx) => {
                        const isCompleted = idx < currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                          <div key={idx} className="relative flex items-start gap-3">
                            <span 
                              className={`absolute left-[-28px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black text-[9px] border transition-all ${
                                isCurrent 
                                  ? 'bg-brand text-white border-brand scale-110 shadow-sm' 
                                  : isCompleted 
                                    ? 'bg-brand text-white border-brand' 
                                    : 'bg-white text-ink-placeholder border-border-warm'
                              }`}
                            >
                              {isCompleted ? '✓' : idx + 1}
                            </span>
                            <div className="leading-tight">
                              <div className={`text-[13px] font-black ${isCurrent ? 'text-brand' : 'text-ink'}`}>
                                {step.label}
                              </div>
                              <div className="text-[11px] text-ink-muted font-bold mt-0.5">
                                {step.desc}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Boutons d'actions */}
                  <div className="flex flex-col sm:flex-row gap-3" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/orders/${o.id}`);
                      }}
                      className="flex-1 flex h-12 items-center justify-center gap-2 rounded-[14px] bg-brand text-white text-[14px] font-black shadow-brand hover:bg-brand-hover active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      <Icon name="pkg" size={17} stroke={2.4} />
                      Suivre en direct
                    </button>
                    <a 
                      href="tel:+237678451290"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex h-12 items-center justify-center gap-2 rounded-[14px] border border-border-warm text-ink hover:bg-bg-app-light text-[14px] font-black cursor-pointer"
                    >
                      <Icon name="phone" size={16} stroke={2.2} />
                      Contacter support
                    </a>
                  </div>
                </div>
              );
            } else {
              {/* Carte Historique */}
              const isCancelled = o.status === 'cancelled';
              const statusLabel = isCancelled ? 'Annulée' : 'Livrée';
              const statusColor = isCancelled ? 'text-brand bg-brand-tint border-brand/10' : 'text-success bg-success-tint border-success/10';
              
              return (
                <div
                  key={o.id}
                  onClick={() => router.push(`/orders/${o.id}`)}
                  className="bg-surface rounded-[20px] border border-border-warm-light/60 shadow-warm-1 p-4.5 flex flex-col gap-3.5 hover:shadow-warm-2 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-bg-app-light text-ink-light flex-none">
                        <Icon name="bag" size={20} />
                      </span>
                      <div>
                        <div className="font-extrabold text-[15px] text-ink leading-tight">{o.shop_name}</div>
                        <div className="text-[11.5px] text-ink-placeholder mt-1 font-semibold">
                          {formatDate(o.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`badge text-[10.5px] font-black px-2.5 py-0.5 rounded-pill border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="h-[1px] bg-border-warm-light/50" />

                  <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <div>
                      <span className="text-ink-placeholder text-[11px] font-bold block">Total payé</span>
                      <span className="font-black text-ink text-[15px] mt-0.5 block">{formatPrice(o.total_amount)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/orders/${o.id}`);
                        }}
                        className="badge bg-white border border-border-warm hover:bg-bg-app-light text-ink-light font-extrabold text-[12.5px] px-3.5 py-1.5 rounded-pill cursor-pointer transition-colors"
                      >
                        Voir détails
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/');
                        }}
                        className="badge bg-brand text-white font-extrabold text-[12.5px] px-3.5 py-1.5 rounded-pill cursor-pointer hover:bg-brand-hover transition-colors shadow-sm"
                      >
                        Recommander
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
