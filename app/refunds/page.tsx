'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';

export default function RefundsPage() {
  const router = useRouter();

  return (
    <div className="page-enter flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand shadow-sm">
        <Icon name="percent" size={30} stroke={2} />
      </span>
      <h1 className="text-3xl font-black tracking-tight text-ink">Politique de Remboursement</h1>
      <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink-light text-left">
        RUSH s'engage à vous fournir un service de livraison d'excellence à Douala. Si votre commande présente un article manquant, endommagé ou non conforme, vous pouvez formuler une réclamation auprès de notre support sous 24 heures.
      </p>
      <div className="mt-6 text-[13px] text-ink-muted text-left border-l-2 border-brand/40 pl-4 leading-relaxed">
        * En cas d'erreur avérée du commerçant ou du livreur, les remboursements sont effectués directement sur votre numéro Mobile Money associé.
        <br /><br />
        * Si un produit commandé est indisponible lors de la préparation, son montant est automatiquement déduit du total facturé.
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
