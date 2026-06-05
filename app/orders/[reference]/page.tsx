'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { MOCK_ORDERS, MOCK_PRODUCTS } from '@/lib/mock-data';
import Icon from '@/components/shared/icon';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/cart-context';

const TRACKING_STEPS = [
  { k: 'confirmed', label: 'Commande confirmée', ic: 'check', desc: 'Votre commande a été validée.' },
  { k: 'preparing', label: 'En préparation', ic: 'bag', desc: 'Le commerçant emballe vos produits.' },
  { k: 'out_for_delivery', label: 'En route vers vous', ic: 'truck', desc: 'Le livreur est en chemin.' },
  { k: 'delivered', label: 'Livré', ic: 'home', desc: 'Commande remise à votre porte.' },
];

const MOCK_ORDER_ITEMS_MAP: Record<string, { name: string; qty: number; price: number }[]> = {
  'RSH-20492': [
    { name: 'Riz parfumé 5 kg', qty: 1, price: 6500 },
    { name: 'Ndolé préparé', qty: 1, price: 3500 },
    { name: 'Jus de gingembre', qty: 1, price: 1800 }
  ],
  'RSH-20410': [
    { name: 'Ndolé préparé', qty: 2, price: 3500 }
  ],
  'RSH-20377': [
    { name: 'Pain complet', qty: 2, price: 600 },
    { name: 'Eau minérale 1,5 L', qty: 1, price: 2500 }
  ]
};

const MOCK_PAYMENT_MAP: Record<string, { method: string; status: string }> = {
  'RSH-20492': { method: 'MTN MoMo', status: 'Payé' },
  'RSH-20410': { method: 'Orange Money', status: 'Payé' },
  'RSH-20377': { method: 'Cash', status: 'À payer à la livraison' }
};

interface TrackingPageProps {
  params: Promise<{ reference: string }>;
}

export default function OrderTrackingPage({ params }: TrackingPageProps) {
  const router = useRouter();
  const { reference } = use(params);
  const { addToCart, clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isRealtime, setIsRealtime] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [orderItems, setOrderItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<{ method: string; status: string }>({ method: 'Espèces', status: 'À la livraison' });

  // Charger la commande initiale (mock ou Supabase)
  useEffect(() => {
    // 1. Chercher dans les commandes mockées d'abord
    const mockO = MOCK_ORDERS.find((o) => o.id === reference);
    if (mockO) {
      setOrder(mockO);
      const stepIndex = TRACKING_STEPS.findIndex((s) => s.k === mockO.status);
      setActiveStep(stepIndex >= 0 ? stepIndex : 0);
      setOrderItems(MOCK_ORDER_ITEMS_MAP[mockO.id] || []);
      setPaymentInfo(MOCK_PAYMENT_MAP[mockO.id] || { method: 'MTN MoMo', status: 'Payé' });
      setHasLoaded(true);
    }

    // 2. Interroger Supabase et s'abonner aux changements temps réel
    const supabase = createClient();
    
    async function fetchOrder() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', reference)
          .single();
        
        if (data) {
          // Joindre le nom de boutique mockée correspondante
          const formattedOrder: Order = {
            ...data,
            shop_name: MOCK_ORDERS.find(mo => mo.shop_id === data.shop_id)?.shop_name || 'Boutique Partenaire',
          };
          setOrder(formattedOrder);
          
          const stepIndex = TRACKING_STEPS.findIndex((s) => s.k === data.status);
          setActiveStep(stepIndex >= 0 ? stepIndex : 0);

          // Récupérer les articles depuis Supabase
          const { data: dbItems } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', reference);
          
          if (dbItems && dbItems.length > 0) {
            setOrderItems(dbItems.map(item => ({
              name: item.product_name,
              qty: item.quantity,
              price: item.unit_price
            })));
          } else {
            setOrderItems(MOCK_ORDER_ITEMS_MAP[reference] || []);
          }

          // Déduire les infos de paiement
          setPaymentInfo({
            method: data.payment_method === 'cash' ? 'Paiement à la livraison (Cash)' : data.payment_method === 'orange' ? 'Orange Money' : 'MTN MoMo',
            status: data.status === 'delivered' ? 'Payé' : data.payment_method === 'cash' ? 'À payer à la livraison' : 'Confirmé'
          });
        }
      } catch (err) {
        console.warn('Supabase non disponible pour fetch initial. Suivi local simulé.');
      } finally {
        setHasLoaded(true);
      }
    }
    
    fetchOrder();

    // 3. Abonnement temps réel Supabase
    try {
      const channel = supabase
        .channel(`order-tracking-${reference}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${reference}`,
          },
          (payload: any) => {
            console.log('Changement de commande reçu en temps réel:', payload.new);
            const newOrder = payload.new as Order;
            setOrder((prev) => prev ? { 
              ...prev, 
              status: newOrder.status,
              courier_name: newOrder.courier_name,
              courier_phone: newOrder.courier_phone,
              eta_minutes: newOrder.eta_minutes
            } : null);
            
            const stepIndex = TRACKING_STEPS.findIndex((s) => s.k === newOrder.status);
            setActiveStep(stepIndex >= 0 ? stepIndex : 0);
            setIsRealtime(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('Realtime Supabase désactivé ou indisponible.');
    }
  }, [reference]);

  // Si la commande n'est pas encore chargée
  if (!hasLoaded && !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="sk-anim w-12 h-12 rounded-full mb-3" />
        <h2 className="font-extrabold text-[16px] text-ink">Recherche de la commande...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-enter flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon name="pkg" size={30} stroke={1.9} />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink">Commande introuvable</h1>
        <p className="mt-2 max-w-md text-[14px] font-semibold leading-relaxed text-ink-light">
          Cette commande n’existe pas ou n’est plus accessible.
        </p>
        <button
          onClick={() => router.push('/orders')}
          className="mt-6 flex h-11 items-center justify-center rounded-pill bg-ink px-6 text-[13px] font-black text-white shadow-warm-1 cursor-pointer"
        >
          Retour à Mes commandes
        </button>
      </div>
    );
  }

  // Calcul du temps estimé dynamique
  const etaMinutes = order.eta_minutes ?? (activeStep >= 3 ? 0 : 12 - activeStep * 4);

  const handleReorder = () => {
    clearCart();
    orderItems.forEach((item) => {
      const prod = MOCK_PRODUCTS.find((p) => p.name === item.name);
      if (prod) {
        addToCart(prod, item.qty);
      }
    });
    router.push('/cart');
  };

  const canCancel = order.status === 'pending' || order.status === 'confirmed';
  const handleCancel = async () => {
    if (!canCancel) return;
    setOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    try {
      const supabase = createClient();
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    } catch (e) {}
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-warm-light">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/orders')}
            className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
          >
            <Icon name="chevL" size={22} stroke={2.3} />
          </button>
          <div>
            <h1 className="font-black text-lg text-ink leading-tight">Suivi de commande</h1>
            <div className="text-[12px] text-ink-placeholder font-semibold mt-0.5">{order.id}</div>
          </div>
        </div>

        <span className="badge bg-brand-tint text-brand font-black text-[11px] px-2.5 py-1 rounded-pill flex items-center gap-1">
          {isRealtime && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />}
          {TRACKING_STEPS[activeStep]?.label || order.status}
        </span>
      </div>

      {/* Grid adaptative */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Colonne gauche : Carte & Détails du livreur */}
        <div className="flex-1 flex flex-col gap-4.5 w-full">
          {/* Carte SVG stylisée */}
          <div className="h-[210px] w-full rounded-lg overflow-hidden relative bg-gradient-to-br from-[#EAF1EC] to-[#F4F0EE] shadow-warm-1">
            <svg width="100%" height="100%" viewBox="0 0 400 210" className="absolute inset-0 select-none">
              <g stroke="#D8E0D9" strokeWidth="2" fill="none">
                <path d="M0 50 H400 M0 110 H400 M0 170 H400 M80 0 V210 M200 0 V210 M320 0 V210" />
              </g>
              {/* Tracé de livraison en rouge */}
              <path 
                d="M60 180 Q120 150 150 110 T 300 50" 
                stroke="var(--red)" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="2 10" 
                strokeLinecap="round" 
              />
            </svg>
            
            {/* Icône de destination (Maison) */}
            <span className="absolute left-[44px] bottom-[18px] text-ink">
              <Icon name="home" size={26} />
            </span>
            
            {/* Icône de livreur en mouvement */}
            <span 
              className="absolute w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shadow-brand transition-all duration-1000"
              style={{
                left: `${50 + activeStep * 70}px`,
                bottom: `${20 + activeStep * 35}px`,
              }}
            >
              <Icon name="truck" size={22} />
            </span>

            {/* Carte du livreur collée sur l'image */}
            <div className="absolute left-3.5 right-3.5 bottom-3.5 bg-surface p-3 rounded-md flex items-center gap-3 shadow-warm-2">
              <span className="w-10 h-10 rounded-md bg-ink text-white flex items-center justify-center flex-none">
                <Icon name="user" size={20} />
              </span>
              <div className="flex-1">
                <div className="font-extrabold text-[13.5px] text-ink leading-tight">
                  {order.courier_name || 'Eric N.'}
                </div>
                <div className="flex items-center gap-1 text-[11.5px] text-ink-placeholder font-semibold mt-0.5">
                  <Icon name="star" size={11} stroke={0} style={{ fill: 'var(--amber)', color: 'var(--amber)' }} />
                  4.9 · Moto de livraison
                </div>
              </div>
              
              <a 
                href={`tel:${order.courier_phone || '+237678451290'}`}
                className="w-9.5 h-9.5 rounded-full bg-green-tint text-success flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              >
                <Icon name="phone" size={18} />
              </a>
            </div>
          </div>

          {/* Estimation d'arrivée (ETA) */}
          <div className="text-center py-4 bg-surface rounded-lg shadow-warm-1 border border-border-warm-light">
            <div className="text-[12.5px] text-ink-placeholder font-extrabold tracking-wider uppercase">Arrivée estimée</div>
            <div className="font-black text-3xl md:text-4xl text-ink tracking-tighter mt-1">
              {activeStep >= 3 ? 'Livré !' : `${etaMinutes} min`}
            </div>
          </div>
        </div>

        {/* Colonne droite : Frise chronologique (Timeline) */}
        <div className="w-full md:w-[360px] flex-none card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4">
          <h3 className="font-extrabold text-[15px] text-ink tracking-tight border-b border-border-warm-light pb-2">
            Étapes de livraison
          </h3>
          
          <div className="flex flex-col gap-2.5">
            {TRACKING_STEPS.map((s, i) => {
              const done = i <= activeStep;
              const current = i === activeStep;
              return (
                <div key={s.k} className="flex gap-4 items-start relative">
                  {/* Ligne verticale de liaison */}
                  {i < TRACKING_STEPS.length - 1 && (
                    <span 
                      className={`absolute left-[18px] top-10 w-[3px] h-[34px] rounded-full transition-colors duration-500 ${
                        i < activeStep ? 'bg-brand' : 'bg-border-warm'
                      }`}
                    />
                  )}
                  
                  {/* Icône de l'étape */}
                  <span 
                    className={`w-9.5 h-9.5 rounded-full flex items-center justify-center flex-none transition-all duration-300 ${
                      done 
                        ? 'bg-brand text-white shadow-brand' 
                        : 'bg-surface text-ink-placeholder border border-border-warm'
                    }`}
                  >
                    <Icon name={done ? 'check' : s.ic} size={18} stroke={done ? 3 : 1.9} />
                  </span>
                  
                  {/* Texte de l'étape */}
                  <div className="pt-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span 
                        className={`font-bold text-[14.5px] ${
                          current ? 'text-brand font-black' : done ? 'text-ink' : 'text-ink-placeholder'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <p className={`text-[12px] mt-0.5 ${current ? 'text-ink-light font-medium' : 'text-ink-placeholder'}`}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-[1px] bg-border-warm-light my-1" />

          {/* Articles commandés */}
          {orderItems.length > 0 && (
            <div className="flex flex-col gap-2 my-1">
              <span className="text-[12px] font-bold text-ink-muted">Articles commandés</span>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[12.5px] font-semibold text-ink-light">
                    <span className="truncate pr-2">
                      <b className="text-brand font-black">{item.qty}×</b> {item.name}
                    </span>
                    <span className="flex-none">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="h-[1px] bg-border-warm-light/40 my-1" />
            </div>
          )}

          {/* Infos de facturation rapide */}
          <div className="text-[12.5px] text-ink-muted leading-relaxed flex flex-col gap-1">
            <div><strong>Commerçant :</strong> {order.shop_name}</div>
            <div><strong>Adresse :</strong> Quartier {order.delivery_address}</div>
            <div>
              <strong>Paiement :</strong> {paymentInfo.method} · <span className={paymentInfo.status === 'Payé' ? 'text-success font-bold' : 'text-brand font-bold'}>{paymentInfo.status}</span>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-border-warm-light/40 flex justify-between items-center text-[13.5px]">
              <span className="font-extrabold text-ink">Montant total</span>
              <span className="font-black text-brand text-[15px]">{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={handleReorder}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-pill bg-brand text-white text-[13px] font-black shadow-brand hover:bg-brand-hover active:scale-[0.98] transition-transform cursor-pointer"
            >
              <Icon name="cart" size={16} stroke={2.2} />
              Recommander la commande
            </button>
            <div className="flex gap-2">
              <a
                href="tel:+237678451290"
                className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-pill border border-border-warm text-ink hover:bg-bg-app-light text-[12px] font-extrabold cursor-pointer"
              >
                <Icon name="phone" size={14} />
                Support
              </a>
              {canCancel ? (
                <button
                  onClick={handleCancel}
                  className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-pill border border-brand text-brand hover:bg-brand-tint text-[12px] font-extrabold cursor-pointer active:scale-95 transition-transform"
                >
                  <Icon name="trash" size={14} />
                  Annuler
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-pill border border-border-warm text-ink-placeholder bg-bg-app-light text-[12px] font-extrabold cursor-not-allowed"
                  title="Annulation indisponible"
                >
                  <Icon name="trash" size={14} />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

