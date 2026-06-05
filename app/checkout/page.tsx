'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { formatPrice } from '@/lib/utils';
import { placeOrder } from '@/app/actions/checkout';
import { PaymentMethod } from '@/types';
import Icon from '@/components/shared/icon';
import { MOCK_PRODUCTS } from '@/lib/mock-data';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Formulaire
  const [address, setAddress] = useState('Akwa, Rue Joss');
  const [phone, setPhone] = useState('678451290');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn');
  const [note, setNote] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  // Charger le code promo depuis localStorage
  useEffect(() => {
    const promo = localStorage.getItem('rush_promo');
    if (promo === 'RUSH25') {
      setPromoApplied(true);
    }
  }, []);

  const deliveryThreshold = 10000;
  const isDeliveryFree = cartTotal >= deliveryThreshold;
  const deliveryFee = cartTotal === 0 ? 0 : (isDeliveryFree ? 0 : 700);
  const discountAmount = promoApplied ? Math.round(cartTotal * 0.25) : 0;
  const finalTotal = cartTotal + deliveryFee - discountAmount;

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="font-black text-xl text-ink">Panier vide</h2>
        <p className="text-ink-muted mt-2">Vous devez ajouter des produits avant de valider.</p>
        <button 
          onClick={() => router.push('/categories')}
          className="btn btn-dark h-11 bg-ink text-white font-bold px-6 rounded-pill mt-5"
        >
          Découvrir les produits
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setErrorMessage('Veuillez entrer une adresse de livraison.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Veuillez entrer un numéro de téléphone.');
      return;
    }

    setIsPending(true);
    setErrorMessage('');

    try {
      const res = await placeOrder({
        cart,
        promoCode: promoApplied ? 'RUSH25' : null,
        paymentMethod,
        deliveryAddress: address,
        deliveryPhone: `+237${phone.replace(/\s+/g, '')}`,
        note,
      });

      if (res.success && res.paymentUrl) {
        // Vider le panier après commande réussie
        clearCart();
        localStorage.removeItem('rush_promo');
        
        // Rediriger vers l'URL de paiement ou de confirmation
        router.push(res.paymentUrl);
      } else {
        setErrorMessage(res.message || 'Une erreur est survenue lors de la validation de la commande.');
        setIsPending(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Impossible de joindre le serveur de validation.');
      setIsPending(false);
    }
  };

  const paymentGateways = [
    { id: 'mtn', name: 'MTN Mobile Money', sub: 'Paiement direct sécurisé', tint: '#FFF6D6', ink: '#C79A00', tag: 'MTN' },
    { id: 'orange', name: 'Orange Money', sub: 'Paiement direct sécurisé', tint: '#FFE9D6', ink: '#E2730B', tag: 'OM' },
    { id: 'cash', name: 'Paiement à la livraison', sub: 'Espèces au livreur', tint: '#E6F6EC', ink: '#15A05A', tag: '₣' },
  ];

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-border-warm-light">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
        >
          <Icon name="chevL" size={22} stroke={2.3} />
        </button>
        <h1 className="font-black text-2xl text-ink tracking-tight">Commande</h1>
      </div>

      {/* Grid adaptative */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 items-start w-full">
        
        {/* Colonne gauche : Formulaires */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Section 1 : Adresse de livraison */}
          <div className="card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-extrabold text-[12.5px]">1</span>
              <h2 className="font-black text-base text-ink tracking-tight">Adresse de livraison</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">Quartier & Adresse précise</label>
                <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                  <Icon name="home" size={18} className="text-ink-placeholder" />
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex. Akwa, Rue Joss, à côté du supermarché..."
                    className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] ml-2 text-ink"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">Numéro de téléphone (MTN / Orange)</label>
                <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                  <Icon name="phone" size={18} className="text-ink-placeholder" />
                  <span className="font-bold text-ink-muted text-[14.5px] ml-2">+237</span>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="678451290"
                    maxLength={9}
                    className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] ml-1 text-ink"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 : Méthode de paiement */}
          <div className="card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-extrabold text-[12.5px]">2</span>
              <h2 className="font-black text-base text-ink tracking-tight">Méthode de paiement</h2>
            </div>
            
            <div className="flex flex-col gap-2.5">
              {paymentGateways.map((g) => {
                const selected = paymentMethod === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setPaymentMethod(g.id as PaymentMethod)}
                    className={`flex items-center gap-4 p-3.5 rounded-md border cursor-pointer text-left transition-all ${
                      selected 
                        ? 'bg-brand-tint/30 border-brand shadow-sm' 
                        : 'bg-surface border-border-warm hover:bg-bg-app-light'
                    }`}
                  >
                    <span 
                      className="w-11 h-11 rounded-md flex items-center justify-center font-black text-[13.5px]"
                      style={{ backgroundColor: g.tint, color: g.ink }}
                    >
                      {g.tag}
                    </span>
                    <div className="flex-1">
                      <div className="font-extrabold text-[14px] text-ink leading-none">{g.name}</div>
                      <div className="text-[12px] text-ink-placeholder mt-1 font-semibold">{g.sub}</div>
                    </div>
                    <span 
                      className="w-[22px] h-[22px] rounded-full border flex items-center justify-center transition-all"
                      style={{ 
                        borderColor: selected ? 'var(--red)' : 'var(--line)', 
                        backgroundColor: selected ? 'var(--red)' : '#ffffff' 
                      }}
                    >
                      {selected && <Icon name="check" size={14} stroke={3} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2">
              <label className="block text-[12.5px] font-extrabold text-ink-light mb-1.5 ml-1">Note pour le livreur (optionnel)</label>
              <div className="flex items-center bg-bg-app-light rounded-md px-3.5 h-12 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
                <input 
                  type="text" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex. Appelez-moi avant d'arriver..."
                  className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] text-ink"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : Résumé final & Paiement (Sidebar) */}
        <div className="w-full md:w-[360px] flex-none flex flex-col gap-5">
          {/* Facturation finale */}
          <div className="card bg-surface p-4 rounded-lg shadow-warm-1 flex flex-col gap-4">
            <h3 className="font-extrabold text-[14.5px] text-ink tracking-tight flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center font-extrabold text-[12.5px]">3</span>
              Résumé final
            </h3>
            
            {/* Lignes de commande */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.key} className="flex justify-between text-[13.5px] text-ink-light font-semibold">
                  <span className="truncate pr-4"><b className="text-brand font-black">{item.qty}×</b> {item.name}</span>
                  <span className="flex-none">{formatPrice(item.unit * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="h-[1px] bg-border-warm-light my-1" />

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px] text-ink-muted font-semibold">
                <span>Sous-total</span>
                <span className="text-ink">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink-muted font-semibold">
                <span>Frais de livraison</span>
                <span className={deliveryFee === 0 ? 'text-success font-black' : 'text-ink'}>
                  {deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-[13px] text-brand font-bold">
                  <span>Réduction (RUSH25)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              
              <div className="h-[1px] bg-border-warm-light my-1" />
              
              <div className="flex items-center justify-between py-0.5">
                <span className="font-black text-[16px] text-ink">Total final</span>
                <span className="price font-black text-[20px] text-ink">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="text-[12.5px] font-bold text-brand p-2 bg-brand-tint border border-brand/20 rounded-md">
                {errorMessage}
              </div>
            )}

            {/* Bouton de validation de paiement Desktop */}
            <button
              type="submit"
              disabled={isPending}
              className="hidden md:flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer hover:bg-brand-hover disabled:bg-brand/50 active:scale-98 transition-all mt-3"
            >
              {isPending ? (
                <span className="sk-anim w-5 h-5 rounded-full" />
              ) : (
                <>
                  Confirmer & payer
                  <Icon name="arrowR" size={19} stroke={2.2} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Raccourci Validation mobile collant en bas */}
        <div className="md:hidden fixed left-0 right-0 bottom-0 bg-surface/94 backdrop-blur-md border-t border-border-warm p-4.5 pb-safe flex items-center gap-4.5 z-30 shadow-warm-2">
          <div className="leading-none">
            <div className="text-[11.5px] text-ink-placeholder font-bold">Total final</div>
            <div className="price font-extrabold text-[20px] text-ink mt-1">{formatPrice(finalTotal)}</div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer active:scale-95 disabled:bg-brand/50 transition-all"
          >
            {isPending ? (
              <span className="sk-anim w-5 h-5 rounded-full" />
            ) : (
              <>
                Confirmer & payer
                <Icon name="arrowR" size={19} stroke={2.2} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
