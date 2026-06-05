'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';

export default function ContactPage() {
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="page-enter flex flex-col items-center justify-center min-h-[60vh] px-4 py-10 max-w-lg mx-auto w-full">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand shadow-sm">
        <Icon name="phone" size={28} />
      </span>
      <h1 className="text-3xl font-black tracking-tight text-ink text-center">Contactez-nous</h1>
      
      {!sent ? (
        <form onSubmit={handleSubmit} className="card bg-surface p-5 rounded-xl border border-border-warm shadow-warm-1 w-full mt-6 flex flex-col gap-4">
          <div>
            <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">Nom complet</label>
            <input
              type="text"
              required
              placeholder="Ex. Jean Dupont"
              className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">Adresse e-mail</label>
            <input
              type="email"
              required
              placeholder="Ex. jean@gmail.com"
              className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-extrabold text-ink-light mb-1 ml-1">Votre Message</label>
            <textarea
              required
              rows={4}
              placeholder="Comment pouvons-nous vous aider ?"
              className="w-full bg-bg-app-light border border-border-warm rounded-md p-3.5 outline-none text-ink font-semibold resize-none"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary h-11 bg-brand text-white font-extrabold text-[13px] rounded-pill shadow-brand cursor-pointer hover:bg-brand-hover mt-2"
          >
            Envoyer le message
          </button>
        </form>
      ) : (
        <div className="card bg-surface p-6 rounded-xl border border-border-warm shadow-warm-1 text-center flex flex-col items-center mt-6 w-full py-10">
          <span className="w-12 h-12 rounded-full bg-green-tint text-success flex items-center justify-center mb-4">
            <Icon name="check" size={24} stroke={3} />
          </span>
          <h3 className="font-extrabold text-lg text-ink">Message envoyé !</h3>
          <p className="text-[13px] text-ink-muted mt-2 leading-relaxed">
            Merci pour votre message. Nos équipes de support à Douala prendront contact avec vous par e-mail dans les plus brefs délais.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 flex h-10 items-center justify-center rounded-pill bg-ink px-6 text-[12.5px] font-black text-white shadow-warm-1 cursor-pointer"
          >
            Retour à l'accueil
          </button>
        </div>
      )}
    </div>
  );
}
