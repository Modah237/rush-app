'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useRushStore } from '@/context/rush-store-context';
import { useUserLocation } from '@/context/location-context';
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { getCategoryTheme } from '@/components/shared/category-theme';
import { formatPrice } from '@/lib/utils';
import { evaluatePromoCode, RUSH_PROMOS } from '@/lib/promos';
import Icon from '@/components/shared/icon';
import ProductImage from '@/components/shared/product-image';
import EmptyState from '@/components/shared/empty-state';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, cartTotal, cartCount } = useCart();
  const { pushToast, trackEvent } = useRushStore();
  const { location: userLoc, openPicker } = useUserLocation();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('rush_promo');
    if (saved) {
      setPromoCode(saved);
      setAppliedPromo(saved);
    }
  }, []);

  const promoEval = evaluatePromoCode(appliedPromo, cartTotal);
  const deliveryThreshold = 10000;
  const isDeliveryFree = cartTotal >= deliveryThreshold || promoEval.freeDelivery;
  const deliveryFee = cartTotal === 0 ? 0 : isDeliveryFree ? 0 : 700;
  const discountAmount = promoEval.valid ? promoEval.discountAmount : 0;
  const finalTotal = Math.max(0, cartTotal + deliveryFee - discountAmount);

  const applyPromo = (codeOverride?: string) => {
    const candidate = (codeOverride ?? promoCode).trim().toUpperCase();
    const res = evaluatePromoCode(candidate, cartTotal);
    if (res.valid && res.promo) {
      setPromoCode(res.promo.code);
      setAppliedPromo(res.promo.code);
      setPromoError('');
      localStorage.setItem('rush_promo', res.promo.code);
      trackEvent('promo_applied', res.promo.code);
      pushToast(`Code ${res.promo.code} appliqué !`, 'success');
    } else {
      setPromoError(res.reason || 'Code invalide ou expiré');
      setAppliedPromo(null);
      localStorage.removeItem('rush_promo');
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    localStorage.removeItem('rush_promo');
  };

  if (cart.length === 0) {
    return (
      <div className="page-enter min-h-[70vh] flex flex-col justify-center">
        <EmptyState
          icon="cart"
          title="Votre panier est vide"
          text="Ajoutez des produits frais ou des plats pour démarrer votre commande rapide."
          cta="Découvrir les produits"
          onCta={() => router.push('/categories')}
        />
      </div>
    );
  }

  const handleCheckoutClick = () => {
    trackEvent('checkout_start', 'cart_to_checkout', finalTotal, { items: cartCount });
    router.push('/checkout');
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-24 md:pb-8">
      {/* Titre + Zone de livraison active */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-warm-light">
        <div className="flex items-center gap-3">
          <h1 className="font-black text-2xl text-ink tracking-tight flex items-center gap-2">
            Mon panier
          </h1>
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1 rounded-pill bg-bg-app-light border border-border-warm px-2.5 py-1 text-[11px] font-extrabold text-ink-light hover:text-brand cursor-pointer"
          >
            <Icon name="pin" size={12} className="text-brand" />
            {userLoc.cityName} · {userLoc.zoneName}
          </button>
        </div>
        <span className="badge bg-brand-tint text-brand font-black text-[12px] px-2.5 py-1 rounded-pill">
          {cartCount} articles
        </span>
      </div>

      {(() => {
        const shopIds = Array.from(
          new Set(
            cart
              .map((item) => MOCK_PRODUCTS.find((p) => p.id === item.id)?.shop_id)
              .filter(Boolean)
          )
        ) as string[];
        if (shopIds.length <= 1) return null;
        const shopNames = shopIds
          .map((sid) => MOCK_SHOPS.find((s) => s.id === sid)?.name)
          .filter(Boolean)
          .join(' + ');
        return (
          <div className="rounded-[14px] border border-amber/25 bg-amber-tint/50 px-4 py-2.5 text-[12.5px] font-bold text-ink flex items-center gap-2">
            <Icon name="bag" size={15} className="text-warning flex-none" />
            <span>
              Panier multi-boutiques ({shopNames}) : RUSH coordonne le retrait groupé en un seul passage Rusher.
            </span>
          </div>
        );
      })()}

      {/* Grid adaptative : 2 colonnes sur desktop, 1 sur mobile */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Colonne gauche : Liste des produits */}
        <div className="flex-1 flex flex-col gap-3.5 w-full">
          {cart.map((item) => {
            const theme = getCategoryTheme(item.cat);
            return (
              <div
                key={item.key}
                className="card flex items-stretch p-3 gap-4 bg-surface rounded-lg shadow-warm-1"
              >
                <div className="w-[74px] h-[74px] flex-none">
                  <ProductImage glyph={item.glyph} tint={theme.tint} ink={theme.ink} radius="13px" />
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-extrabold text-[14.5px] text-ink leading-tight pr-6">
                        {item.name}
                      </div>
                      <div className="text-[11.5px] text-ink-placeholder mt-1 font-semibold">
                        {item.optName || item.sub}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="text-ink-placeholder hover:text-brand cursor-pointer p-1 transition-colors"
                      aria-label={`Retirer ${item.name}`}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="price font-extrabold text-[15.5px] text-brand">
                      {formatPrice(item.unit * item.qty)}
                    </span>

                    <div className="flex items-center bg-surface border border-border-warm rounded-pill transform scale-90 origin-right">
                      <button
                        onClick={() => updateQty(item.key, item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center text-ink cursor-pointer"
                      >
                        <Icon name="minus" size={16} stroke={2.4} />
                      </button>
                      <span className="min-w-[20px] text-center font-black text-[14px]">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.key, item.qty + 1)}
                        className="w-8.5 h-8.5 flex items-center justify-center text-ink cursor-pointer"
                      >
                        <Icon name="plus" size={16} stroke={2.4} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!isDeliveryFree && (
            <div className="card bg-surface border border-border-warm rounded-lg p-3.5 shadow-warm-1">
              <div className="flex items-center gap-2 font-bold text-[12.5px] text-ink-light">
                <Icon name="truck" size={16} className="text-brand" />
                Plus que <span className="text-brand font-black">{formatPrice(deliveryThreshold - cartTotal)}</span> pour la livraison gratuite
              </div>
              <div className="h-1.5 bg-bg-app-light rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (cartTotal / deliveryThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : Code promo & Facturation (Sidebar) */}
        <div className="w-full md:w-[360px] flex-none flex flex-col gap-5">
          {/* Panneau Code Promo */}
          <div className="card bg-surface p-4 rounded-lg shadow-warm-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[14.5px] text-ink tracking-tight">Code de réduction</h3>
              {appliedPromo && (
                <button
                  type="button"
                  onClick={removePromo}
                  className="text-[11px] font-black text-brand hover:underline cursor-pointer"
                >
                  Retirer
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative flex items-center bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm flex-1 focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                <Icon name="tag" size={18} className={promoEval.valid ? 'text-success' : 'text-ink-placeholder'} />
                <input
                  type="text"
                  placeholder="RUSH25, BIENVENUE..."
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError('');
                  }}
                  className="w-full bg-transparent border-none outline-none font-semibold text-[14px] ml-2 text-ink uppercase"
                />
              </div>
              <button
                type="button"
                onClick={() => applyPromo()}
                className="btn btn-dark h-11 bg-ink text-white font-bold px-4 rounded-md cursor-pointer hover:bg-ink-light active:scale-95 transition-transform"
              >
                {promoEval.valid ? 'Appliqué' : 'Valider'}
              </button>
            </div>

            {/* Raccourcis codes promos */}
            <div className="flex flex-wrap gap-1.5">
              {RUSH_PROMOS.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => applyPromo(p.code)}
                  className={`text-[10.5px] font-black px-2.5 py-1 rounded-pill border cursor-pointer transition-colors ${
                    appliedPromo === p.code
                      ? 'bg-brand text-white border-brand'
                      : 'bg-bg-app-light text-ink-light border-border-warm-light hover:border-brand/40'
                  }`}
                >
                  {p.code} ({p.discountLabel})
                </button>
              ))}
            </div>

            {(promoError || (appliedPromo && !promoEval.valid && promoEval.reason)) && (
              <div className="text-[12px] font-bold text-brand ml-1 mt-0.5">
                {promoError || promoEval.reason}
              </div>
            )}
            {promoEval.valid && promoEval.promo && (
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-success ml-1 mt-1 leading-none">
                <Icon name="check" size={15} stroke={3} />
                Code {promoEval.promo.code} — {promoEval.promo.title} ({promoEval.promo.discountLabel})
              </div>
            )}
          </div>

          {/* Panneau de Facturation */}
          <div className="card bg-surface p-4 rounded-lg shadow-warm-1 flex flex-col gap-3">
            <h3 className="font-extrabold text-[14.5px] text-ink tracking-tight">Résumé de la commande</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[13.5px] text-ink-muted font-semibold py-1">
                <span>Sous-total</span>
                <span className="text-ink font-bold">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[13.5px] text-ink-muted font-semibold py-1">
                <span>Frais de livraison (base)</span>
                <span className={deliveryFee === 0 ? 'text-success font-black' : 'text-ink font-bold'}>
                  {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
                </span>
              </div>
              {discountAmount > 0 && promoEval.promo && (
                <div className="flex items-center justify-between text-[13.5px] text-brand font-bold py-1">
                  <span>Réduction ({promoEval.promo.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="h-[1px] bg-border-warm-light my-1" />
              <div className="flex items-center justify-between py-1.5">
                <span className="font-black text-[16px] text-ink">Total</span>
                <span className="price font-black text-[20px] text-ink">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="hidden md:flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer hover:bg-brand-hover active:scale-98 transition-transform mt-2"
            >
              Passer au paiement
              <Icon name="arrowR" size={19} stroke={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'action collante en bas (mobile) */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 bg-surface/94 backdrop-blur-md border-t border-border-warm p-4.5 pb-safe flex items-center gap-4.5 z-30 shadow-warm-2">
        <div className="leading-none">
          <div className="text-[11.5px] text-ink-placeholder font-bold">Total à payer</div>
          <div className="price font-extrabold text-[20px] text-ink mt-1">{formatPrice(finalTotal)}</div>
        </div>
        <button
          onClick={handleCheckoutClick}
          className="flex-1 flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer active:scale-95 transition-transform"
        >
          Valider la commande
          <Icon name="arrowR" size={19} stroke={2.2} />
        </button>
      </div>
    </div>
  );
}
