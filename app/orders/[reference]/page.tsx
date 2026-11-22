'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { MOCK_ORDERS, MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { calculateDistanceKm, resolveLocationFromText } from '@/lib/cameroon-geo';
import CameroonMap from '@/components/maps/cameroon-map';
import Icon from '@/components/shared/icon';
import { formatPrice } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/context/cart-context';
import { useRushStore } from '@/context/rush-store-context';
import { RiderTelemetryPoint, subscribeRiderTelemetry } from '@/lib/telemetry';
import { sendRushPushNotification } from '@/lib/push';

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
    { name: 'Jus de gingembre', qty: 1, price: 1800 },
  ],
  'RSH-20410': [{ name: 'Ndolé préparé', qty: 2, price: 3500 }],
  'RSH-20377': [
    { name: 'Pain complet', qty: 2, price: 600 },
    { name: 'Eau minérale 1,5 L', qty: 1, price: 2500 },
  ],
};

const MOCK_PAYMENT_MAP: Record<string, { method: string; status: string }> = {
  'RSH-20492': { method: 'MTN MoMo', status: 'Payé' },
  'RSH-20410': { method: 'Orange Money', status: 'Payé' },
  'RSH-20377': { method: 'Cash', status: 'À payer à la livraison' },
};

interface TrackingPageProps {
  params: Promise<{ reference: string }>;
}

export default function OrderTrackingPage({ params }: TrackingPageProps) {
  const router = useRouter();
  const { reference } = use(params);
  const { addToCart, clearCart } = useCart();
  const { getOrderByReference, updateOrderStatus, submitOrderReview, getOrderReview, pushToast, isHydrated } = useRushStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isRealtime, setIsRealtime] = useState(false);
  const [autoLiveSim, setAutoLiveSim] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState<RiderTelemetryPoint | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTags, setReviewTags] = useState<string[]>(['Rapide']);
  const [reviewComment, setReviewComment] = useState('');
  const [orderItems, setOrderItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<{ method: string; status: string }>({
    method: 'MTN MoMo',
    status: 'Confirmé',
  });

  // Charger depuis le store local (commandes fraîches + mock) puis Supabase
  useEffect(() => {
    if (!isHydrated) return;

    const localOrMock = getOrderByReference(reference) || MOCK_ORDERS.find((o) => o.id === reference) || null;
    if (localOrMock) {
      setOrder(localOrMock);
      const stepIndex = TRACKING_STEPS.findIndex((s) => s.k === localOrMock.status);
      setActiveStep(stepIndex >= 0 ? stepIndex : 0);

      if (localOrMock.items && localOrMock.items.length > 0) {
        setOrderItems(
          localOrMock.items.map((it) => ({
            name: it.name,
            qty: it.qty,
            price: it.unit_price,
          }))
        );
      } else {
        setOrderItems(MOCK_ORDER_ITEMS_MAP[localOrMock.id] || []);
      }

      if (localOrMock.payment_method) {
        setPaymentInfo({
          method:
            localOrMock.payment_method === 'cash'
              ? 'Paiement à la livraison (Cash)'
              : localOrMock.payment_method === 'orange'
                ? 'Orange Money'
                : 'MTN MoMo',
          status:
            localOrMock.status === 'delivered'
              ? 'Payé'
              : localOrMock.payment_method === 'cash'
                ? 'À payer à la livraison'
                : 'Confirmé',
        });
      } else {
        setPaymentInfo(MOCK_PAYMENT_MAP[localOrMock.id] || { method: 'MTN MoMo', status: 'Payé' });
      }
      setHasLoaded(true);
    }

    const supabase = createClient();

    async function fetchOrder() {
      try {
        const { data } = await supabase.from('orders').select('*').eq('id', reference).single();
        if (data) {
          const formattedOrder: Order = {
            ...data,
            shop_name: MOCK_ORDERS.find((mo) => mo.shop_id === data.shop_id)?.shop_name || 'Boutique Partenaire',
          };
          setOrder(formattedOrder);
          const stepIndex = TRACKING_STEPS.findIndex((s) => s.k === data.status);
          setActiveStep(stepIndex >= 0 ? stepIndex : 0);

          const { data: dbItems } = await supabase.from('order_items').select('*').eq('order_id', reference);
          if (dbItems && dbItems.length > 0) {
            setOrderItems(
              dbItems.map((item) => ({
                name: item.product_name,
                qty: item.quantity,
                price: item.unit_price,
              }))
            );
          }

          setPaymentInfo({
            method:
              data.payment_method === 'cash'
                ? 'Paiement à la livraison (Cash)'
                : data.payment_method === 'orange'
                  ? 'Orange Money'
                  : 'MTN MoMo',
            status: data.status === 'delivered' ? 'Payé' : data.payment_method === 'cash' ? 'À payer à la livraison' : 'Confirmé',
          });
        }
      } catch {
        // Mode local actif
      } finally {
        setHasLoaded(true);
      }
    }

    fetchOrder();

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
          (payload: { new: Order }) => {
            const newOrder = payload.new;
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: newOrder.status,
                    courier_name: newOrder.courier_name,
                    courier_phone: newOrder.courier_phone,
                    eta_minutes: newOrder.eta_minutes,
                  }
                : null
            );
            const stepIndex = TRACKING_STEPS.findIndex((s) => s.k === newOrder.status);
            setActiveStep(stepIndex >= 0 ? stepIndex : 0);
            setIsRealtime(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime indisponible
    }
  }, [reference, isHydrated, getOrderByReference]);

  // Abonnement à la télémétrie GPS temps réel du Rusher
  useEffect(() => {
    const unsubscribe = subscribeRiderTelemetry(reference, (pt) => {
      setLiveTelemetry(pt);
      setIsRealtime(true);
    });
    return unsubscribe;
  }, [reference]);

  // Progression automatique en direct si activée par l'utilisateur
  useEffect(() => {
    if (!autoLiveSim || !order || order.status === 'delivered' || order.status === 'cancelled') return;

    const timer = setInterval(() => {
      setActiveStep((curr) => {
        const nextIdx = Math.min(TRACKING_STEPS.length - 1, curr + 1);
        const nextStatus = TRACKING_STEPS[nextIdx].k as OrderStatus;
        setOrder((prev) => (prev ? { ...prev, status: nextStatus, eta_minutes: nextIdx >= 3 ? 0 : 12 - nextIdx * 4 } : null));
        updateOrderStatus(order.id, nextStatus, `Progression en direct : ${TRACKING_STEPS[nextIdx].label}`);
        setIsRealtime(true);
        if (nextIdx >= TRACKING_STEPS.length - 1) {
          setAutoLiveSim(false);
          pushToast(`Commande ${order.id} livrée !`, 'success');
        }
        return nextIdx;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [autoLiveSim, order, updateOrderStatus, pushToast]);

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

  const etaMinutes = order.eta_minutes ?? (activeStep >= 3 ? 0 : 14 - activeStep * 4);
  const shopLocation = MOCK_SHOPS.find((s) => s.id === order.shop_id);
  const pickupLat = shopLocation?.lat ?? 4.0548;
  const pickupLng = shopLocation?.lng ?? 9.7012;
  const dropoffResolved = resolveLocationFromText(order.delivery_address);
  const dropoffLat = order.delivery_lat ?? dropoffResolved.lat;
  const dropoffLng = order.delivery_lng ?? dropoffResolved.lng;

  const progressRatio = activeStep === 0 ? 0.08 : activeStep === 1 ? 0.35 : activeStep === 2 ? 0.72 : 1;
  const riderLat = liveTelemetry ? liveTelemetry.lat : pickupLat + (dropoffLat - pickupLat) * progressRatio;
  const riderLng = liveTelemetry ? liveTelemetry.lng : pickupLng + (dropoffLng - pickupLng) * progressRatio;
  const routeDistanceKm = calculateDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng);

  const handleAdvanceStep = () => {
    if (activeStep >= TRACKING_STEPS.length - 1 || order.status === 'cancelled') return;
    const nextIdx = activeStep + 1;
    const nextStatus = TRACKING_STEPS[nextIdx].k as OrderStatus;
    setActiveStep(nextIdx);
    setIsRealtime(true);
    setOrder((prev) => (prev ? { ...prev, status: nextStatus, eta_minutes: nextIdx >= 3 ? 0 : 14 - nextIdx * 4 } : null));
    updateOrderStatus(order.id, nextStatus, TRACKING_STEPS[nextIdx].desc);
    pushToast(`Statut mis à jour : ${TRACKING_STEPS[nextIdx].label}`, 'info');
    sendRushPushNotification(
      `RUSH · ${order.id}`,
      `${TRACKING_STEPS[nextIdx].label} — ${TRACKING_STEPS[nextIdx].desc}`,
      `/orders/${order.id}`
    );
  };

  const handleShareTracking = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url) navigator.clipboard?.writeText(url).catch(() => {});
    pushToast('Lien de suivi copié dans le presse-papiers', 'success');
  };

  const handlePrintReceipt = () => {
    if (typeof window !== 'undefined') window.print();
  };

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
    updateOrderStatus(order.id, 'cancelled', 'Annulée par le client');
    pushToast(`Commande ${order.id} annulée`, 'warning');
    try {
      const supabase = createClient();
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    } catch {
      // Fallback local
    }
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border-warm-light">
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareTracking}
            className="h-9 px-3 rounded-pill bg-surface border border-border-warm text-[11.5px] font-extrabold text-ink hover:bg-bg-app-light cursor-pointer"
          >
            Partager
          </button>
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="h-9 px-3 rounded-pill bg-surface border border-border-warm text-[11.5px] font-extrabold text-ink hover:bg-bg-app-light cursor-pointer"
          >
            Reçu
          </button>
          <span className="badge bg-brand-tint text-brand font-black text-[11px] px-2.5 py-1 rounded-pill flex items-center gap-1">
            {(isRealtime || autoLiveSim) && <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />}
            {order.status === 'cancelled' ? 'Annulée' : TRACKING_STEPS[activeStep]?.label || order.status}
          </span>
        </div>
      </div>

      {/* Grid adaptative */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Colonne gauche : Carte réelle du Cameroun & Détails du livreur */}
        <div className="flex-1 flex flex-col gap-4.5 w-full">
          <div className="relative">
            <CameroonMap
              center={[riderLat, riderLng]}
              zoom={14}
              fitMarkers
              useRoadRouting
              showLayerToggle
              heightClassName="h-[310px]"
              markers={[
                {
                  id: 'order-shop',
                  lat: pickupLat,
                  lng: pickupLng,
                  title: order.shop_name || 'Boutique RUSH',
                  subtitle: `Retrait · ${shopLocation?.quarter || 'Douala'}`,
                  badge: 'Départ',
                  variant: 'shop',
                },
                {
                  id: 'order-rider',
                  lat: riderLat,
                  lng: riderLng,
                  title: `${order.courier_name || 'Eric N.'} · Rusher`,
                  subtitle: activeStep >= 3 ? 'Arrivé à destination' : `À ${routeDistanceKm} km · ETA ${etaMinutes} min`,
                  badge: TRACKING_STEPS[activeStep]?.label,
                  variant: 'rider',
                  pulse: activeStep < 3 && order.status !== 'cancelled',
                },
                {
                  id: 'order-dropoff',
                  lat: dropoffLat,
                  lng: dropoffLng,
                  title: 'Destination client',
                  subtitle: `${order.delivery_address} (${order.delivery_city || dropoffResolved.cityName})`,
                  badge: 'Livraison',
                  variant: 'customer',
                },
              ]}
              routes={[
                {
                  id: 'order-route',
                  points: [
                    [pickupLat, pickupLng],
                    [dropoffLat, dropoffLng],
                  ],
                  color: '#F50012',
                  dashed: true,
                  weight: 4,
                },
              ]}
            />

            <div className="mt-3 bg-surface p-3.5 rounded-lg flex items-center gap-3 shadow-warm-1 border border-border-warm-light">
              <span className="w-10 h-10 rounded-md bg-ink text-white flex items-center justify-center flex-none">
                <Icon name="user" size={20} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[13.5px] text-ink leading-tight truncate">
                  {order.courier_name || 'Eric N.'}
                </div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-ink-placeholder font-semibold mt-0.5">
                  <Icon name="star" size={11} stroke={0} style={{ fill: 'var(--amber)', color: 'var(--amber)' }} />
                  4.9 · Moto de livraison · {routeDistanceKm} km ({order.delivery_city || dropoffResolved.cityName})
                  {liveTelemetry && (
                    <span className="ml-1 rounded-pill bg-green-tint text-success px-2 py-0.5 text-[10px] font-black">
                      GPS live {liveTelemetry.speedKmh} km/h
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-none">
                <a
                  href={`https://wa.me/${(order.courier_phone || '+237678451290').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${order.courier_name || ''}, je suis le client pour la commande RUSH ${order.id}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9.5 px-3 rounded-full bg-[#E6F6EC] text-success font-extrabold text-[11.5px] flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                  title="Contacter sur WhatsApp"
                >
                  WhatsApp
                </a>
                <a
                  href={`tel:${order.courier_phone || '+237678451290'}`}
                  className="w-9.5 h-9.5 rounded-full bg-green-tint text-success flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  title="Appeler le Rusher"
                >
                  <Icon name="phone" size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Estimation d'arrivée (ETA) + Code PIN sécurisé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-center py-4 bg-surface rounded-lg shadow-warm-1 border border-border-warm-light">
              <div className="text-[11.5px] text-ink-placeholder font-extrabold tracking-wider uppercase">Arrivée estimée</div>
              <div className="font-black text-3xl text-ink tracking-tighter mt-1">
                {order.status === 'cancelled' ? 'Annulée' : activeStep >= 3 ? 'Livré !' : `${etaMinutes} min`}
              </div>
            </div>
            <div className="text-center py-4 bg-surface rounded-lg shadow-warm-1 border border-border-warm-light">
              <div className="text-[11.5px] text-ink-placeholder font-extrabold tracking-wider uppercase">Code PIN de remise</div>
              <div className="font-black text-3xl text-brand tracking-[0.2em] mt-1">
                {order.delivery_pin || '4829'}
              </div>
            </div>
          </div>

          {/* Contrôles Temps Réel (Démonstration Live) */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="bg-surface rounded-lg p-3.5 border border-border-warm-light shadow-warm-1 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[12px] font-bold text-ink-light">
                Suivi temps réel GPS
                <span className="block text-[11px] font-semibold text-ink-muted">
                  Synchronisé avec le poste livreur & Supabase Realtime
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAutoLiveSim((v) => !v)}
                  className={`h-8.5 px-3 rounded-pill text-[11.5px] font-black cursor-pointer transition-colors ${
                    autoLiveSim ? 'bg-brand text-white' : 'bg-bg-app-light text-ink hover:bg-border-warm'
                  }`}
                >
                  {autoLiveSim ? 'Pause live' : 'Auto-live'}
                </button>
                <button
                  type="button"
                  onClick={handleAdvanceStep}
                  className="h-8.5 px-3 rounded-pill bg-ink text-white text-[11.5px] font-black cursor-pointer hover:bg-brand transition-colors"
                >
                  Étape suivante →
                </button>
              </div>
            </div>
          )}

          {/* Évaluation Post-Livraison (Noter le Rusher & la boutique) */}
          {order.status === 'delivered' && (() => {
            const existingReview = getOrderReview(order.id);
            if (existingReview) {
              return (
                <div className="bg-green-tint/40 border border-success/20 rounded-lg p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12.5px] font-black text-success">
                      Merci pour votre avis ({existingReview.rating}/5 ★) · +100 pts fidélité
                    </div>
                    {existingReview.comment && (
                      <p className="text-[12px] font-semibold text-ink-light mt-0.5">« {existingReview.comment} »</p>
                    )}
                  </div>
                  <span className="rounded-pill bg-success text-white px-2.5 py-1 text-[10.5px] font-black">
                    Enregistré
                  </span>
                </div>
              );
            }
            const quickTags = ['Rapide ⚡', 'Colis intact 📦', 'Rusher poli 👍', 'À recommander 🔥'];
            return (
              <div className="bg-surface rounded-lg p-4 border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-[14.5px] text-ink">Évaluer la livraison</h3>
                    <p className="text-[11.5px] font-semibold text-ink-muted">
                      Notez {order.courier_name || 'votre Rusher'} & {order.shop_name} (+100 pts)
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform active:scale-90"
                        aria-label={`${star} étoiles`}
                      >
                        <Icon
                          name="star"
                          size={20}
                          stroke={1.6}
                          style={{
                            fill: star <= reviewRating ? 'var(--amber)' : 'none',
                            color: star <= reviewRating ? 'var(--amber)' : 'var(--ink-4)',
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {quickTags.map((tag) => {
                    const selected = reviewTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setReviewTags((prev) =>
                            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                          )
                        }
                        className={`rounded-pill px-2.5 py-1 text-[11px] font-extrabold border cursor-pointer transition-colors ${
                          selected
                            ? 'bg-ink text-white border-ink'
                            : 'bg-bg-app-light text-ink-light border-border-warm'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Un mot sur la livraison (optionnel)..."
                    className="flex-1 bg-bg-app-light border border-border-warm rounded-md px-3 h-10 text-[12.5px] font-semibold text-ink outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      submitOrderReview({
                        orderId: order.id,
                        rating: reviewRating,
                        tags: reviewTags,
                        comment: reviewComment.trim(),
                      });
                      pushToast('Avis enregistré · +100 points fidélité !', 'success');
                    }}
                    className="h-10 px-4 rounded-pill bg-brand text-white font-black text-[12px] shadow-brand hover:bg-brand-hover cursor-pointer"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Colonne droite : Frise chronologique (Timeline) */}
        <div className="w-full md:w-[360px] flex-none card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4">
          <h3 className="font-extrabold text-[15px] text-ink tracking-tight border-b border-border-warm-light pb-2">
            Étapes de livraison
          </h3>

          <div className="flex flex-col gap-2.5">
            {TRACKING_STEPS.map((s, i) => {
              const done = i <= activeStep && order.status !== 'cancelled';
              const current = i === activeStep && order.status !== 'cancelled';
              return (
                <div key={s.k} className="flex gap-4 items-start relative">
                  {i < TRACKING_STEPS.length - 1 && (
                    <span
                      className={`absolute left-[18px] top-10 w-[3px] h-[34px] rounded-full transition-colors duration-500 ${
                        i < activeStep && order.status !== 'cancelled' ? 'bg-brand' : 'bg-border-warm'
                      }`}
                    />
                  )}

                  <span
                    className={`w-9.5 h-9.5 rounded-full flex items-center justify-center flex-none transition-all duration-300 ${
                      done ? 'bg-brand text-white shadow-brand' : 'bg-surface text-ink-placeholder border border-border-warm'
                    }`}
                  >
                    <Icon name={done ? 'check' : s.ic} size={18} stroke={done ? 3 : 1.9} />
                  </span>

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
            <div><strong>Adresse :</strong> {order.delivery_address}</div>
            <div>
              <strong>Paiement :</strong> {paymentInfo.method} ·{' '}
              <span className={paymentInfo.status === 'Payé' ? 'text-success font-bold' : 'text-brand font-bold'}>
                {paymentInfo.status}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="text-success font-bold">
                Réduction appliquée : -{formatPrice(order.discount_amount)}
              </div>
            )}
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
