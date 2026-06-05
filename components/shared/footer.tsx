'use client';

import React from 'react';
import Link from 'next/link';
import Icon from './icon';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-ink text-white/78 w-full border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="flex flex-col gap-4">
            <div className="text-2xl font-black tracking-tight text-white">
              RUSH<span className="text-brand">.</span>
            </div>
            <p className="max-w-[280px] text-[13.5px] font-semibold leading-relaxed text-white/55">
              Votre quartier livré maintenant. Courses, repas et essentiels livrés rapidement à Douala.
            </p>
            <div className="flex items-center gap-2 text-[13px] font-bold text-white/65 mt-1">
              <Icon name="pin" size={15} className="text-brand" />
              <span>Zone : Douala, Cameroun</span>
            </div>
            <div className="mt-3">
              <div className="text-[11px] font-bold text-white/45 mb-2 uppercase tracking-wider">Paiements sécurisés</div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black tracking-wide text-white/82 shadow-sm">
                  MTN MoMo
                </span>
                <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-black tracking-wide text-white/82 shadow-sm">
                  Orange Money
                </span>
              </div>
            </div>
          </div>

          {/* Client Links */}
          <div className="flex flex-col gap-3">
            <div className="text-[15px] font-black text-white tracking-wide">RUSH</div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Catégories
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Panier
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Commandes
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div className="flex flex-col gap-3">
            <div className="text-[15px] font-black text-white tracking-wide">Partenaires</div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/merchant" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  merchant.rush
                </Link>
              </li>
              <li>
                <Link href="/rider" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  rider.rush
                </Link>
              </li>
              <li>
                <Link href="/drive" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  drive.rush
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Legal */}
          <div className="flex flex-col gap-3">
            <div className="text-[15px] font-black text-white tracking-wide">Support & Légal</div>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/help" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Aide & FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-[13.5px] font-semibold text-white/62 transition-colors hover:text-brand">
                  Remboursements
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/5 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-[12.5px] font-semibold text-white/45">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} RUSH. Tous droits réservés.</span>
            <span>·</span>
            <Link href="/terms" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
          <div className="flex items-center gap-2 select-none">
            <span className="text-white/20">Fait avec</span>
            <span className="text-brand">❤️</span>
            <span className="text-white/20">à Douala</span>
            <Link href="/admin" className="text-white/5 hover:text-brand ml-1">.</Link>
          </div>
        </div>
      </div>
      {/* Mobile TabBar spacing offset */}
      <div className="h-[86px] w-full md:hidden" />
    </footer>
  );
};

export default Footer;
