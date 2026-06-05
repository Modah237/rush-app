'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';

interface PromoCodeItem {
  code: string;
  discount: string;
  title: string;
  description: string;
  minAmount: string;
  expiry: string;
  tint: string;
  ink: string;
}

const MOCK_PROMOS: PromoCodeItem[] = [
  {
    code: 'RUSH25',
    discount: '-25%',
    title: 'Offre Spéciale RUSH',
    description: 'Bénéficiez de 25% de réduction immédiate sur tous vos articles favoris.',
    minAmount: 'Sans minimum',
    expiry: 'Valable jusqu\'au 31 Déc 2026',
    tint: '#FFE9EB',
    ink: '#F50012'
  },
  {
    code: 'BIENVENUE',
    discount: 'Gratuit',
    title: 'Livraison Offerte',
    description: 'Frais de livraison offerts pour célébrer votre première commande RUSH.',
    minAmount: 'Min. commande 3 000 FCFA',
    expiry: 'Valable 30 jours',
    tint: '#E6F6EC',
    ink: '#15A05A'
  },
  {
    code: 'MOMO500',
    discount: '-500 F',
    title: 'Bonus MTN MoMo',
    description: 'Réduction exclusive pour tout paiement effectué via MTN Mobile Money.',
    minAmount: 'Min. commande 5 000 FCFA',
    expiry: 'Valable tout le mois',
    tint: '#FFF6D6',
    ink: '#C79A00'
  },
  {
    code: 'ORANGEDG',
    discount: 'Offert',
    title: 'Ndolé de Fête',
    description: 'Une portion individuelle de Ndolé traditionnel offerte avec votre commande.',
    minAmount: 'Min. commande 15 000 FCFA',
    expiry: 'Ce week-end uniquement',
    tint: '#FFE9D6',
    ink: '#E2730B'
  }
];

export default function PromosPage() {
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    // Si c'est RUSH25, on l'applique dans le localStorage pour qu'il soit automatiquement détecté au checkout !
    if (code === 'RUSH25') {
      localStorage.setItem('rush_promo', 'RUSH25');
    }
    
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div className="page-enter flex flex-col gap-6 px-4 md:px-0 mt-5 pb-24 md:pb-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-border-warm-light">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
        >
          <Icon name="chevL" size={22} stroke={2.3} />
        </button>
        <div>
          <h1 className="font-black text-2xl text-ink tracking-tight">Promotions & Codes</h1>
          <p className="text-[13px] font-semibold text-ink-placeholder mt-0.5">
            Copiez un code et collez-le lors de votre commande pour en profiter.
          </p>
        </div>
      </div>

      {/* Hero Banner Promo */}
      <div className="bg-gradient-to-br from-brand to-brand-active text-white rounded-2xl p-6 shadow-warm-2 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <span className="badge bg-white/20 text-white font-black text-[11px] px-3 py-1 rounded-pill w-max mx-auto sm:mx-0">
            OFFRE DU MOMENT
          </span>
          <h2 className="font-black text-xl tracking-tight leading-tight">Obtenez -25% sur votre panier</h2>
          <p className="text-[13px] text-white/80 font-semibold max-w-md">
            Utilisez le code RUSH25 pour économiser sur votre repas ou vos courses ce soir à Douala.
          </p>
        </div>
        <button
          onClick={() => handleCopy('RUSH25')}
          className="bg-white text-brand font-black text-[13.5px] px-6 py-3 rounded-pill cursor-pointer shadow-warm-1 hover:bg-bg-app-light transition-transform active:scale-95 flex-none"
        >
          {copiedCode === 'RUSH25' ? 'Code copié & appliqué !' : 'Copier RUSH25'}
        </button>
      </div>

      {/* Liste des codes */}
      <div className="flex flex-col gap-4">
        <h3 className="font-black text-lg text-ink tracking-tight mt-2">Tous les codes disponibles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_PROMOS.map((promo) => {
            const isCopied = copiedCode === promo.code;
            return (
              <div 
                key={promo.code}
                className="bg-surface rounded-2xl border border-border-warm-light/60 p-4.5 flex flex-col justify-between gap-4 shadow-warm-1 hover:shadow-warm-2 transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span 
                      className="font-black text-[15px] px-2.5 py-0.5 rounded w-max"
                      style={{ backgroundColor: promo.tint, color: promo.ink }}
                    >
                      {promo.discount}
                    </span>
                    <h4 className="font-black text-[16px] text-ink leading-tight mt-1">{promo.title}</h4>
                    <p className="text-[12.5px] text-ink-light font-semibold leading-relaxed mt-0.5">
                      {promo.description}
                    </p>
                  </div>
                </div>

                <div className="h-[1px] bg-border-warm-light/50" />

                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-ink-placeholder font-bold leading-tight">
                    <div>{promo.minAmount}</div>
                    <div className="mt-0.5">{promo.expiry}</div>
                  </div>
                  
                  <button
                    onClick={() => handleCopy(promo.code)}
                    className={`h-9.5 px-4 rounded-pill font-black text-[12.5px] cursor-pointer transition-all flex items-center justify-center ${
                      isCopied 
                        ? 'bg-success text-white' 
                        : 'bg-ink text-white hover:bg-ink-light'
                    }`}
                  >
                    {isCopied ? 'Copié !' : promo.code}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
