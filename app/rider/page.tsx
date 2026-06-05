'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/shared/icon';
import SafeImage from '@/components/shared/safe-image';

export default function RiderAcquisitionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const benefits = [
    { ic: 'clock', t: "Horaires flexibles", d: "Travaillez quand vous voulez. Vous ouvrez l'application RUSH et vous vous connectez à votre rythme." },
    { ic: 'wallet', t: "Revenus attractifs", d: "Gagnez un revenu fixe par livraison plus les pourboires clients. Paiements versés par Mobile Money." },
    { ic: 'shield', t: "Assistance Douala 7j/7", d: "Bénéficiez d'une équipe locale à votre écoute pour vous guider et vous aider lors de vos courses." },
    { ic: 'pin', t: "Zones locales proches", d: "Livrez principalement dans votre quartier d'habitation pour optimiser vos trajets et vos gains." },
    { ic: 'truck', t: "Tout type de véhicule", d: "Livrez à moto (le plus rapide à Douala), en voiture de livraison ou même à vélo." }
  ];

  const requirements = [
    { t: "Pièce d'identité", d: "Carte Nationale d'Identité (CNI) ou passeport valide." },
    { t: "Casier Judiciaire", d: "Un extrait de casier judiciaire (bulletin n°3) datant de moins de 3 mois." },
    { t: "Véhicule en règle", d: "Carte grise, assurance et permis de conduire (si véhicule motorisé)." },
    { t: "Smartphone connecté", d: "Un téléphone Android ou iOS avec une connexion Internet et GPS actif." }
  ];

  const steps = [
    { num: '1', title: "Inscription", desc: "Créez votre profil de Rusher en ligne en 2 minutes." },
    { num: '2', title: "Justificatifs", desc: "Uploadez vos pièces d'identité et de sécurité sur votre dashboard." },
    { num: '3', title: "Validation", desc: "L'administration de RUSH vérifie et valide votre dossier sous 24h." },
    { num: '4', title: "En route !", desc: "Connectez-vous sur l'application RUSH et commencez à livrer." }
  ];

  const faqs = [
    { q: "Quels sont les critères de validation des dossiers ?", a: "Pour garantir la sécurité de la communauté RUSH, chaque livreur doit fournir une CNI valide et un casier judiciaire vierge. Le véhicule utilisé doit également posséder des papiers en règle." },
    { q: "Comment et quand suis-je payé ?", a: "Vos gains de livraison sont cumulés sur votre compte et reversés automatiquement ou sur demande via MTN MoMo ou Orange Money chaque semaine." },
    { q: "Est-il possible de livrer sans moto ?", a: "Oui, bien que la moto soit le véhicule le plus rapide et le plus populaire à Douala, vous pouvez livrer en voiture ou même à vélo pour les courtes distances." },
    { q: "Y a-t-il des frais d'inscription ?", a: "Non, l'inscription sur rider.rush et l'accès au réseau de livraison de RUSH sont totalement gratuits pour tous les livreurs partenaires." }
  ];

  return (
    <div className="page-enter flex flex-col gap-10 pb-16">
      {/* Navigation Header local */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-warm flex items-center justify-between h-14 px-4 md:px-0">
        <div className="flex items-center gap-1.5">
          <span className="text-success font-black text-lg">rider</span>
          <span className="text-ink font-semibold">.rush</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-bold text-ink-light">
          <a href="#benefits" className="hover:text-success">Avantages</a>
          <a href="#conditions" className="hover:text-success">Conditions</a>
          <a href="#how" className="hover:text-success">Fonctionnement</a>
          <a href="#faq" className="hover:text-success">FAQ</a>
        </nav>
        <Link 
          href="/rider/dashboard" 
          className="btn h-9 bg-success text-white font-extrabold text-[12.5px] px-4 rounded-pill hover:opacity-90 active:scale-95 transition-transform"
        >
          S'inscrire
        </Link>
      </header>

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] items-center gap-8 px-4 md:px-0 mt-4">
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-tint px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-success">
            <Icon name="truck" size={13} /> DEVENIR LIVREUR À DOUALA
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-ink leading-tight">
            Livrez où et quand vous voulez.
          </h1>
          <p className="text-[15.5px] font-semibold text-ink-light leading-relaxed max-w-lg">
            Gagnez de l'argent en livrant des courses, des repas et des colis dans votre quartier à Douala. Travaillez en toute liberté.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link 
              href="/rider/dashboard" 
              className="flex h-12 items-center justify-center gap-2 rounded-pill bg-success text-white font-black text-[13.5px] shadow-[0_4px_12px_rgba(21,160,90,0.3)] hover:opacity-95 active:scale-98 transition-all"
            >
              Devenir livreur vérifié
              <Icon name="arrowR" size={15} stroke={2.5} />
            </Link>
            <a 
              href="#conditions" 
              className="flex h-12 items-center justify-center rounded-pill border border-border-warm px-6 text-[13.5px] font-extrabold text-ink bg-surface hover:bg-bg-app-light transition-colors"
            >
              Conditions requises
            </a>
          </div>
        </div>

        {/* Visual Composition */}
        <div className="relative h-[330px] rounded-2xl overflow-hidden shadow-warm-3 border border-border-warm bg-surface">
          <SafeImage 
            src="/rush/rider/courier-hero.jpg" 
            alt="Livreur Rusher officiel avec sac RUSH" 
            radius="16px" 
            aspectRatio="square" 
            className="h-full w-full object-cover" 
          />
        </div>
      </section>

      {/* App Preview Banner */}
      <section className="bg-ink text-white p-6 rounded-[24px] shadow-warm-2 flex flex-col md:flex-row items-center justify-between gap-6 mx-4 md:mx-0">
        <div className="max-w-md">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-success bg-green-tint px-2.5 py-1 rounded-pill">
            Aperçu App Livreur
          </span>
          <h3 className="text-lg font-black tracking-tight mt-2.5">
            Suivi GPS, itinéraires et portefeuille de gains.
          </h3>
          <p className="text-[13px] text-white/60 font-semibold mt-1 leading-relaxed">
            Consultez les adresses de retrait et livraison, contactez le client en un clic et observez la progression de votre cagnotte.
          </p>
        </div>
        <Link 
          href="/rider/dashboard" 
          className="flex h-11 items-center justify-center gap-2 rounded-pill bg-white px-5 text-[12.5px] font-black text-ink shadow-sm hover:translate-x-0.5 transition-transform"
        >
          Accéder à mon espace livreur
          <Icon name="chevR" size={12} stroke={2.5} />
        </Link>
      </section>

      {/* Benefits */}
      <section id="benefits" className="flex flex-col gap-6 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight text-center">
          Les avantages de rejoindre le réseau RUSH
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {benefits.slice(0, 3).map((item) => (
            <div key={item.t} className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-green-tint text-success mb-4">
                <Icon name={item.ic} size={22} />
              </span>
              <h3 className="font-extrabold text-[15.5px] text-ink">{item.t}</h3>
              <p className="text-[13px] font-semibold text-ink-light mt-2 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Conditions / Requirements */}
      <section id="conditions" className="flex flex-col gap-6 bg-surface p-6 rounded-[24px] border border-border-warm mx-4 md:mx-0 shadow-warm-1">
        <h2 className="text-xl font-black text-ink tracking-tight">Conditions et documents requis</h2>
        <p className="text-[13.5px] font-semibold text-ink-light -mt-2">Chaque dossier fait l'objet d'un audit de sécurité pour rassurer nos partenaires.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {requirements.map((req) => (
            <div key={req.t} className="p-4 rounded-lg bg-bg-app-light flex flex-col gap-1">
              <div className="font-extrabold text-[14.5px] text-ink flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {req.t}
              </div>
              <p className="text-[12.5px] font-semibold text-ink-light leading-relaxed pl-3.5">{req.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="flex flex-col gap-6 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight text-center">Comment commencer à livrer ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          {steps.map((step) => (
            <div key={step.num} className="text-center flex flex-col items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-success text-white font-black text-lg flex items-center justify-center shadow-[0_2px_8px_rgba(21,160,90,0.3)]">
                {step.num}
              </span>
              <h3 className="font-extrabold text-[13.5px] text-ink mt-1">{step.title}</h3>
              <p className="text-[11.5px] text-ink-placeholder font-medium leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App Preview Image Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 bg-surface p-6 rounded-[24px] border border-border-warm mx-4 md:mx-0 shadow-warm-1">
        <div>
          <h2 className="text-xl font-black text-ink tracking-tight">Gérez tout depuis votre smartphone</h2>
          <p className="text-[13.5px] font-semibold text-ink-light mt-2 leading-relaxed">
            Notre application d'enrôlement vous permet de scanner directement votre CNI et d'envoyer votre casier judiciaire. Une fois validé, vous recevrez vos courses de livraison et confirmerez chaque dépôt en un clic.
          </p>
        </div>
        <div className="relative h-[250px] rounded-xl overflow-hidden border border-border-warm bg-[#faf8f6]">
          <SafeImage 
            src="/rush/rider/app-preview.jpg" 
            alt="Application RUSH livreur active" 
            radius="12px" 
            className="h-full w-full object-cover" 
          />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="flex flex-col gap-6 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight text-center">Foire Aux Questions</h2>
        <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="card bg-surface rounded-lg border border-border-warm-light shadow-warm-1 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 font-bold text-[14.5px] text-ink text-left outline-none cursor-pointer"
                >
                  {faq.q}
                  <span className={`text-success transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <Icon name="chevD" size={16} stroke={2.5} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-[13.5px] font-semibold text-ink-light leading-relaxed border-t border-border-warm-light/40 pt-3 bg-bg-app-light/30">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-10 bg-gradient-to-br from-ink to-ink-light text-white rounded-[24px] shadow-warm-2 flex flex-col items-center gap-4.5 mx-4 md:mx-0 px-6">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Devenez Rusher aujourd'hui !</h2>
        <p className="text-[14.5px] text-white/60 font-semibold max-w-md">Rejoignez rider.rush, fixez vos propres horaires et commencez à encaisser vos revenus de livraison à Douala.</p>
        <Link 
          href="/rider/dashboard" 
          className="flex h-12 items-center justify-center gap-2 rounded-pill bg-success text-white font-black text-[13.5px] shadow-[0_4px_12px_rgba(21,160,90,0.3)] hover:opacity-95 active:scale-98 transition-all mt-2"
        >
          Créer mon profil Rusher
          <Icon name="arrowR" size={15} stroke={2.5} />
        </Link>
      </section>
    </div>
  );
}
