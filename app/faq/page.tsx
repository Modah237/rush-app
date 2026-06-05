'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';

export default function FaqPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "Dans quelles zones de Douala livrez-vous ?", a: "RUSH livre actuellement dans la majeure partie de la ville de Douala, notamment Akwa, Bonapriso, Deido, Bali, Bonanjo et Denver. D'autres zones sont progressivement ouvertes." },
    { q: "Quels sont vos délais de livraison ?", a: "Nos Rushers effectuent les livraisons en moyenne sous 25 minutes. Ce délai dépend de la distance entre la boutique de retrait et votre adresse." },
    { q: "Quels sont les modes de paiement acceptés ?", a: "Nous acceptons les paiements par MTN Mobile Money (MoMo), Orange Money (OM) ainsi que le paiement en espèces (Cash) à la livraison." },
    { q: "Puis-je modifier ou annuler ma commande ?", a: "Vous pouvez annuler ou modifier votre commande depuis l'écran de suivi tant que son statut est encore 'en attente' ou 'confirmée'. Une fois la préparation lancée, l'annulation n'est plus possible." }
  ];

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-[60vh] px-4 py-10 max-w-lg mx-auto w-full">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand shadow-sm">
        <Icon name="shield" size={28} />
      </span>
      <h1 className="text-3xl font-black tracking-tight text-ink text-center">Foire Aux Questions</h1>
      <p className="text-[13.5px] font-semibold text-ink-light text-center mt-1.5 leading-relaxed">Trouvez des réponses rapides aux questions les plus fréquentes sur l'utilisation de RUSH.</p>

      <div className="flex flex-col gap-2.5 w-full mt-6">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div key={idx} className="card bg-surface rounded-lg border border-border-warm-light shadow-warm-1 overflow-hidden">
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 font-bold text-[14px] text-ink text-left outline-none cursor-pointer"
              >
                {faq.q}
                <span className={`text-brand transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  <Icon name="chevD" size={16} stroke={2.5} />
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-[13px] font-semibold text-ink-light leading-relaxed border-t border-border-warm-light/40 pt-3 bg-bg-app-light/30">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
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
