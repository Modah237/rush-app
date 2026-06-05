'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';
import Link from 'next/link';

export default function HelpPage() {
  const router = useRouter();
  
  return (
    <div className="page-enter flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center max-w-lg mx-auto">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand shadow-sm">
        <Icon name="headset" size={30} stroke={2} />
      </span>
      <h1 className="text-3xl font-black tracking-tight text-ink">Centre d'Aide RUSH</h1>
      <p className="mt-3 text-[14.5px] font-semibold leading-relaxed text-ink-light">
        Besoin d'aide avec votre commande, votre compte partenaire ou votre profil de livraison ? Nos équipes locales sont disponibles 7j/7 pour vous assister.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-8">
        <a 
          href="tel:+237678451290"
          className="flex flex-col items-center p-4 bg-surface rounded-xl border border-border-warm shadow-warm-1 hover:border-brand/40 transition-colors"
        >
          <span className="text-success"><Icon name="phone" size={20} /></span>
          <span className="font-extrabold text-[14px] text-ink mt-2">Appeler le support</span>
          <span className="text-[11px] text-ink-placeholder mt-0.5">+237 6 78 45 12 90</span>
        </a>
        <Link 
          href="/faq"
          className="flex flex-col items-center p-4 bg-surface rounded-xl border border-border-warm shadow-warm-1 hover:border-brand/40 transition-colors"
        >
          <span className="text-brand"><Icon name="shield" size={20} /></span>
          <span className="font-extrabold text-[14px] text-ink mt-2">Consulter la FAQ</span>
          <span className="text-[11px] text-ink-placeholder mt-0.5">Questions fréquentes</span>
        </Link>
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
