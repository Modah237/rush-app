'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/shared/icon';

export default function AccountPage() {
  const router = useRouter();
  
  const profile = {
    name: 'Aïssatou M.',
    phone: '+237 6 78 45 12 90',
    avatarLetter: 'AM',
    location: 'Douala, Akwa',
  };

  const accountMenu = [
    { ic: 'pkg', label: 'Mes commandes', sub: '3 commandes actives et passées', href: '/orders' },
    { ic: 'pin', label: 'Mes adresses', sub: profile.location, href: null },
    { ic: 'wallet', label: 'Moyens de paiement', sub: 'MTN MoMo · Orange Money', href: null },
    { ic: 'heart', label: 'Favoris', sub: '12 produits enregistrés', href: null },
    { ic: 'percent', label: 'Codes promo', sub: '1 code promo disponible (RUSH25)', href: null },
    { ic: 'headset', label: 'Aide & support', sub: 'Service client disponible 7j/7', href: null },
  ];

  return (
    <div className="page-enter flex flex-col gap-6">
      {/* Banner Profil rouge */}
      <div className="bg-gradient-to-br from-[#FF2233] to-brand-active text-white rounded-b-xl md:rounded-xl p-6 shadow-warm-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-black text-xl tracking-tight">Mon compte</h1>
          <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-95 transition-transform">
            <Icon name="bell" size={20} />
          </button>
        </div>

        {/* Détails Utilisateur */}
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-2xl shadow-inner select-none">
            {profile.avatarLetter}
          </span>
          <div>
            <h2 className="font-black text-lg tracking-tight leading-tight">{profile.name}</h2>
            <p className="text-[12.5px] text-white/80 font-semibold mt-1">{profile.phone}</p>
          </div>
        </div>
      </div>

      {/* Raccourcis Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3.5 px-4 md:px-0">
        {[
          { ic: 'pkg', n: '3', t: 'Commandes', href: '/orders' },
          { ic: 'heart', n: '12', t: 'Favoris', href: null },
          { ic: 'wallet', n: '2 500', t: 'Points fidélité', href: null }
        ].map((s, idx) => {
          const content = (
            <div className="card p-4 bg-surface rounded-lg shadow-warm-1 text-center flex flex-col items-center justify-center transition-transform active:scale-[0.97]">
              <span className="text-brand"><Icon name={s.ic} size={22} /></span>
              <div className="font-black text-[16px] text-ink mt-1.5">{s.n}</div>
              <div className="text-[10.5px] text-ink-placeholder font-black uppercase mt-0.5 tracking-wider">{s.t}</div>
            </div>
          );
          
          return s.href ? (
            <Link key={idx} href={s.href}>{content}</Link>
          ) : (
            <div key={idx}>{content}</div>
          );
        })}
      </div>

      {/* Menu d'options */}
      <div className="flex flex-col gap-1 px-4 md:px-0 bg-surface rounded-lg border border-border-warm-light divide-y divide-border-warm-light overflow-hidden shadow-warm-1">
        {accountMenu.map((item, idx) => {
          const content = (
            <div className="flex items-center gap-4 py-3.5 px-4 w-full cursor-pointer hover:bg-bg-app-light transition-colors text-left">
              <span className="w-10.5 h-10.5 rounded-md bg-bg-app-light text-ink-light flex items-center justify-center flex-none">
                <Icon name={item.ic} size={20} />
              </span>
              <div className="flex-1">
                <div className="font-extrabold text-[14.5px] text-ink leading-tight">{item.label}</div>
                <div className="text-[12px] text-ink-placeholder mt-1 font-semibold">{item.sub}</div>
              </div>
              <Icon name="chevR" size={19} stroke={2.2} className="text-ink-placeholder flex-none" />
            </div>
          );

          return item.href ? (
            <Link key={idx} href={item.href} className="block">{content}</Link>
          ) : (
            <div key={idx}>{content}</div>
          );
        })}
      </div>

      {/* Déconnexion */}
      <div className="px-4 md:px-0 mb-6">
        <button 
          onClick={() => router.push('/')}
          className="btn btn-outline h-12 w-full border border-brand/20 hover:bg-brand-tint hover:border-brand/40 text-brand font-extrabold text-[14.5px] rounded-pill cursor-pointer transition-colors active:scale-98"
        >
          Se déconnecter du compte
        </button>
      </div>
    </div>
  );
}
