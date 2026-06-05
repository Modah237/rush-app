'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="page-enter flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand shadow-sm">
        <Icon name="shield" size={30} stroke={2} />
      </span>
      <h1 className="text-3xl font-black tracking-tight text-ink">Politique de Confidentialité</h1>
      <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink-light text-left">
        Chez **RUSH**, nous accordons une importance capitale à la protection de vos données personnelles. Ce document vous informe sur la manière dont nous recueillons et traitons vos informations (nom, adresse de livraison, coordonnées téléphoniques) pour assurer nos services de livraison.
      </p>
      <div className="mt-6 text-[13px] text-ink-muted text-left border-l-2 border-brand/40 pl-4 leading-relaxed">
        * Vos données de paiement (MTN MoMo, Orange Money) sont traitées de manière sécurisée et cryptée par nos partenaires certifiés, sans jamais transiter sur nos serveurs.
        <br /><br />
        * Vos informations géographiques de livraison sont uniquement transmises au Rusher assigné à votre commande pour assurer le transport.
      </div>
      <button
        onClick={() => router.push('/')}
        className="mt-8 flex h-11 items-center justify-center rounded-pill bg-ink px-6 text-[13px] font-black text-white shadow-warm-1 cursor-pointer hover:bg-brand transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  );
}
