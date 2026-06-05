'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/shared/icon';
import SafeImage from '@/components/shared/safe-image';

export default function MerchantAcquisitionPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const whyChooseUs = [
    { ic: 'bowl', t: "Visibilité accrue", d: "Mettez votre catalogue en avant auprès de milliers d'utilisateurs actifs à Douala chaque jour." },
    { ic: 'bag', t: "Gestion simplifiée", d: "Un tableau de bord intuitif pour suivre vos commandes, ajouter des produits et ajuster vos prix en direct." },
    { ic: 'wallet', t: "Paiements MoMo-first", d: "Encaissez vos ventes instantanément et de façon sécurisée via MTN MoMo et Orange Money." },
    { ic: 'truck', t: "Logistique clé en main", d: "Bénéficiez du réseau de Rushers certifiés pour des livraisons rapides à moto en 25 minutes." },
    { ic: 'shield', t: "Payouts réguliers", d: "Profitez de reversements clairs et sans tracas avec un suivi détaillé des commissions (10%)." }
  ];

  const services = [
    { t: 'Marketplace RUSH', d: 'Nous affichons vos produits, gérons le paiement et envoyons un Rusher récupérer et livrer la commande.' },
    { t: 'Livraison RUSH', d: 'Vous vendez déjà en direct ? Utilisez notre réseau de livreurs uniquement pour le transport de vos commandes.' },
    { t: 'Self-Delivery', d: 'Recevez des commandes en ligne sur RUSH et utilisez vos propres livreurs pour la livraison à vos clients.' },
    { t: 'RUSH Drive', d: 'Envoyez un coursier sur demande pour livrer vos colis et ventes réalisées sur WhatsApp ou Instagram.' }
  ];

  const pricing = [
    { n: 'Starter', p: '15 000 FCFA', f: '/ mois', desc: 'Idéal pour tester la livraison et lancer sa boutique en ligne.', features: ['Catalogue illimité', 'Encaissements MoMo/OM', 'Support standard', 'Frais de livraison standard'] },
    { n: 'Growth', p: '25 000 FCFA', f: '/ mois', desc: 'Pour les commerces en croissance voulant plus de visibilité.', features: ['Mise en avant mensuelle', 'Catalogue illimité', 'Support prioritaire 7j/7', 'Analyses de ventes avancées'] },
    { n: 'Pro', p: 'Sur mesure', f: '', desc: 'Pour les chaînes de restaurants et supermarchés de grande taille.', features: ['Intégration API', 'Gestion multi-boutiques', 'Account manager dédié', 'Taux de commission négocié'] }
  ];

  const faqs = [
    { q: "Comment s'inscrire comme commerçant sur RUSH ?", a: "C'est très simple : cliquez sur 'Devenir partenaire', créez votre compte marchand, renseignez vos informations d'établissement et commencez à publier votre catalogue de produits." },
    { q: "Quels sont les frais de commission appliqués ?", a: "RUSH applique une commission fixe transparente de 10% sur le montant des produits vendus via la plateforme. Aucun frais caché n'est facturé." },
    { q: "Comment et quand suis-je payé pour mes ventes ?", a: "Les paiements sont effectués directement sur votre compte Mobile Money associé (MTN MoMo ou Orange Money). Vous pouvez demander des virements réguliers depuis votre tableau de bord." },
    { q: "De quel matériel ai-je besoin pour commencer ?", a: "Une simple tablette ou un smartphone Android/iOS connecté à Internet suffit pour recevoir et valider les commandes entrantes en temps réel." }
  ];

  return (
    <div className="page-enter flex flex-col gap-10 pb-16">
      {/* Navigation Header local */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-warm flex items-center justify-between h-14 px-4 md:px-0">
        <div className="flex items-center gap-1.5">
          <span className="text-brand font-black text-lg">merchant</span>
          <span className="text-ink font-semibold">.rush</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-bold text-ink-light">
          <a href="#why" className="hover:text-brand">Pourquoi RUSH</a>
          <a href="#services" className="hover:text-brand">Services</a>
          <a href="#pricing" className="hover:text-brand">Tarifs</a>
          <a href="#faq" className="hover:text-brand">FAQ</a>
        </nav>
        <Link 
          href="/merchant/dashboard" 
          className="btn h-9 bg-brand text-white font-extrabold text-[12.5px] px-4 rounded-pill hover:bg-brand-hover active:scale-95 transition-transform"
        >
          Devenir partenaire
        </Link>
      </header>

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] items-center gap-8 px-4 md:px-0 mt-4">
        <div className="flex flex-col gap-5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-brand">
            <Icon name="bag" size={13} /> PARTENAIRE RUSH DOUALA
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-ink leading-tight">
            Développez votre activité avec RUSH.
          </h1>
          <p className="text-[15.5px] font-semibold text-ink-light leading-relaxed max-w-lg">
            Touchez plus de clients à Douala, recevez des commandes en ligne payées par Mobile Money et livrez sans gérer toute la logistique.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link 
              href="/merchant/dashboard" 
              className="flex h-12 items-center justify-center gap-2 rounded-pill bg-brand px-6 text-[13.5px] font-black text-white shadow-brand hover:bg-brand-hover active:scale-98 transition-all"
            >
              Accéder à l'espace partenaire
              <Icon name="arrowR" size={15} stroke={2.5} />
            </Link>
            <a 
              href="#pricing" 
              className="flex h-12 items-center justify-center rounded-pill border border-border-warm px-6 text-[13.5px] font-extrabold text-ink bg-surface hover:bg-bg-app-light transition-colors"
            >
              Voir les tarifs
            </a>
          </div>
        </div>

        {/* Visual Composition */}
        <div className="relative h-[330px] rounded-2xl overflow-hidden shadow-warm-3 border border-border-warm bg-surface">
          <SafeImage 
            src="/rush/merchant/partner-join.jpg" 
            alt="Marchand RUSH préparant une commande à Douala" 
            radius="16px" 
            aspectRatio="square" 
            className="h-full w-full object-cover" 
          />
        </div>
      </section>

      {/* Preview Banner */}
      <section className="bg-ink text-white p-6 rounded-[24px] shadow-warm-2 flex flex-col md:flex-row items-center justify-between gap-6 mx-4 md:mx-0">
        <div className="max-w-md">
          <span className="text-[10px] font-black uppercase tracking-[0.1em] text-brand bg-brand-tint px-2.5 py-1 rounded-pill">
            Aperçu Dashboard
          </span>
          <h3 className="text-lg font-black tracking-tight mt-2.5">
            Suivi des ventes et du catalogue en temps réel.
          </h3>
          <p className="text-[13px] text-white/60 font-semibold mt-1 leading-relaxed">
            Consultez instantanément vos commandes reçues, mettez à jour les stocks de votre magasin et suivez l'état de votre abonnement.
          </p>
        </div>
        <Link 
          href="/merchant/dashboard" 
          className="flex h-11 items-center justify-center gap-2 rounded-pill bg-white px-5 text-[12.5px] font-black text-ink shadow-sm hover:translate-x-0.5 transition-transform"
        >
          Découvrir le tableau de bord
          <Icon name="chevR" size={12} stroke={2.5} />
        </Link>
      </section>

      {/* Why Choose Us */}
      <section id="why" className="flex flex-col gap-6 px-4 md:px-0">
        <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight text-center">
          Pourquoi choisir RUSH pour votre boutique ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {whyChooseUs.slice(0, 3).map((item) => (
            <div key={item.t} className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-brand-tint text-brand mb-4">
                <Icon name={item.ic} size={22} />
              </span>
              <h3 className="font-extrabold text-[15.5px] text-ink">{item.t}</h3>
              <p className="text-[13px] font-semibold text-ink-light mt-2 leading-relaxed">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="flex flex-col gap-6 bg-surface p-6 rounded-[24px] border border-border-warm mx-4 md:mx-0 shadow-warm-1">
        <h2 className="text-xl font-black text-ink tracking-tight">Nos Solutions Partenaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => (
            <div key={s.t} className="p-4 rounded-lg bg-bg-app-light flex flex-col gap-1.5">
              <div className="font-extrabold text-[14.5px] text-ink flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                {s.t}
              </div>
              <p className="text-[12.5px] font-semibold text-ink-light leading-relaxed pl-3.5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who it is for */}
      <section className="flex flex-col gap-5 px-4 md:px-0 text-center items-center">
        <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight">Une solution pour chaque commerce</h2>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mt-1">
          {['Restaurants', 'Supermarchés', 'Épiceries', 'Pharmacies', 'Boutiques de mode', 'Dark Kitchens', 'Boulangeries'].map((cat) => (
            <span key={cat} className="bg-bg-app-light border border-border-warm px-4 py-2 rounded-full text-[13px] font-bold text-ink-light shadow-sm">
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="pricing" className="flex flex-col gap-6 px-4 md:px-0">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-black text-ink tracking-tight">Des tarifs transparents, sans mauvaise surprise</h2>
          <p className="text-[13.5px] font-semibold text-ink-light mt-1">Choisissez la formule la plus adaptée à vos volumes et à vos objectifs.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
          {pricing.map((plan) => (
            <div key={plan.n} className="card bg-surface p-5 rounded-[20px] border border-border-warm shadow-warm-1 flex flex-col justify-between min-h-[300px]">
              <div>
                <h3 className="font-extrabold text-md text-ink">{plan.n}</h3>
                <p className="text-[11.5px] text-ink-placeholder mt-0.5 leading-snug">{plan.desc}</p>
                <div className="my-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-brand">{plan.p}</span>
                  <span className="text-[12px] text-ink-placeholder font-bold">{plan.f}</span>
                </div>
                <div className="h-[1px] bg-border-warm-light my-3" />
                <ul className="flex flex-col gap-2 text-[12.5px] font-semibold text-ink-light">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 leading-none">
                      <span className="text-success"><Icon name="check" size={13} stroke={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link 
                href="/merchant/dashboard" 
                className="mt-6 flex h-10.5 items-center justify-center rounded-pill bg-ink text-white text-[12.5px] font-black hover:bg-brand transition-colors cursor-pointer"
              >
                Choisir cette offre
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Onboarding Flow */}
      <section className="flex flex-col gap-6 bg-surface p-6 rounded-[24px] border border-border-warm mx-4 md:mx-0 shadow-warm-1">
        <h2 className="text-xl font-black text-ink tracking-tight text-center">Comment devenir partenaire ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
          {[
            { num: '1', title: 'Création', desc: 'Créez votre compte en quelques clics sur merchant.rush.' },
            { num: '2', title: 'Informations', desc: 'Renseignez les détails de votre commerce et sa localisation.' },
            { num: '3', title: 'Abonnement', desc: 'Réglez votre mensualité via MTN MoMo ou Orange Money.' },
            { num: '4', title: 'Catalogue', desc: 'Ajoutez vos produits avec photos, prix et descriptions.' },
            { num: '5', title: 'Ventes', desc: 'Activez votre boutique et commencez à recevoir des commandes.' }
          ].map((step) => (
            <div key={step.num} className="text-center flex flex-col items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-brand text-white font-black text-lg flex items-center justify-center shadow-brand">
                {step.num}
              </span>
              <h3 className="font-extrabold text-[13.5px] text-ink mt-1">{step.title}</h3>
              <p className="text-[11.5px] text-ink-placeholder font-medium leading-snug">{step.desc}</p>
            </div>
          ))}
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
                  <span className={`text-brand transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
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
        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Prêt à développer votre activité ?</h2>
        <p className="text-[14.5px] text-white/60 font-semibold max-w-md">Rejoignez merchant.rush dès aujourd'hui et commencez à livrer vos clients en 25 minutes à Douala.</p>
        <Link 
          href="/merchant/dashboard" 
          className="flex h-12 items-center justify-center gap-2 rounded-pill bg-brand px-6 text-[13.5px] font-black text-white shadow-brand hover:bg-brand-hover active:scale-98 transition-all mt-2"
        >
          Devenir partenaire RUSH
          <Icon name="arrowR" size={15} stroke={2.5} />
        </Link>
      </section>
    </div>
  );
}
