'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { getCategoryTheme } from '@/components/shared/category-theme';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import ProductImage from '@/components/shared/product-image';
import EmptyState from '@/components/shared/empty-state';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQty, removeFromCart, cartTotal, cartCount } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  // Vérifier la livraison gratuite (dès 10 000 FCFA)
  const deliveryThreshold = 10000;
  const isDeliveryFree = cartTotal >= deliveryThreshold;
  const deliveryFee = cartTotal === 0 ? 0 : (isDeliveryFree ? 0 : 700);

  // Appliquer le code promo RUSH25 (-25%)
  const applyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'RUSH25') {
      setAppliedPromo('RUSH25');
      setPromoError('');
      // Optionnel : stocker le code promo appliqué dans la session ou le localStorage
      localStorage.setItem('rush_promo', 'RUSH25');
    } else {
      setPromoError('Code invalide ou expiré');
      setAppliedPromo(null);
      localStorage.removeItem('rush_promo');
    }
  };

  const discountAmount = appliedPromo === 'RUSH25' ? Math.round(cartTotal * 0.25) : 0;
  const finalTotal = cartTotal + deliveryFee - discountAmount;

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
    // Rediriger vers le checkout
    router.push('/checkout');
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-24 md:pb-8">
      {/* Titre */}
      <div className="flex items-center justify-between pb-2 border-b border-border-warm-light">
        <h1 className="font-black text-2xl text-ink tracking-tight flex items-center gap-2">
          Mon panier
        </h1>
        <span className="badge bg-brand-tint text-brand font-black text-[12px] px-2.5 py-1 rounded-pill">
          {cartCount} articles
        </span>
      </div>

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
                {/* Image du produit */}
                <div className="w-[74px] h-[74px] flex-none">
                  <ProductImage glyph={item.glyph} tint={theme.tint} ink={theme.ink} radius="13px" />
                </div>
                
                {/* Description et contrôles */}
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
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="price font-extrabold text-[15.5px] text-brand">
                      {formatPrice(item.unit * item.qty)}
                    </span>
                    
                    {/* Stepper */}
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

          {/* Barre de progression livraison gratuite */}
          {!isDeliveryFree && (
            <div className="card bg-surface border border-border-warm rounded-lg p-3.5 shadow-warm-1">
              <div className="flex items-center gap-2 font-bold text-[12.5px] text-ink-light">
                <Icon name="truck" size={16} className="text-brand" />
                Plus que <span className="text-brand font-black">{formatPrice(deliveryThreshold - cartTotal)}</span> pour la livraison gratuite
              </div>
              <div className="h-1.5 bg-bg-app-light rounded-full mt-2.5 overflow-hidden">
                <div 
                  className="h-full bg-brand rounded-full transition-all duration-300"
                  style={{ width: `${(cartTotal / deliveryThreshold) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : Code promo & Facturation (Sidebar) */}
        <div className="w-full md:w-[360px] flex-none flex flex-col gap-5">
          {/* Panneau Code Promo */}
          <div className="card bg-surface p-4 rounded-lg shadow-warm-1 flex flex-col gap-3">
            <h3 className="font-extrabold text-[14.5px] text-ink tracking-tight">Code de réduction</h3>
            <div className="flex gap-2">
              <div className="relative flex items-center bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm flex-1 focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                <Icon name="tag" size={18} className={appliedPromo ? 'text-success' : 'text-ink-placeholder'} />
                <input 
                  type="text"
                  placeholder="Entrez votre code (ex: RUSH25)" 
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                  className="w-full bg-transparent border-none outline-none font-semibold text-[14px] ml-2 text-ink uppercase"
                />
              </div>
              <button 
                onClick={applyPromo}
                className="btn btn-dark h-11 bg-ink text-white font-bold px-4 rounded-md cursor-pointer hover:bg-ink-light active:scale-95 transition-transform"
              >
                {appliedPromo ? 'Appliqué' : 'Valider'}
              </button>
            </div>
            {promoError && (
              <div className="text-[12px] font-bold text-brand ml-1 mt-0.5">{promoError}</div>
            )}
            {appliedPromo && (
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-success ml-1 mt-1 leading-none">
                <Icon name="check" size={15} stroke={3} />
                Code RUSH25 — Réduction de 25% appliquée
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
                <span>Frais de livraison</span>
                <span className={deliveryFee === 0 ? 'text-success font-black' : 'text-ink font-bold'}>
                  {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-[13.5px] text-brand font-bold py-1">
                  <span>Réduction (RUSH25)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="h-[1px] bg-border-warm-light my-1" />
              <div className="flex items-center justify-between py-1.5">
                <span className="font-black text-[16px] text-ink">Total</span>
                <span className="price font-black text-[20px] text-ink">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Raccourci Checkout Desktop */}
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

      {/* Barre d'action collante en bas (mobile uniquement, masquée sur desktop) */}
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
