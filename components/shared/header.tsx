'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
import { useCart } from '@/context/cart-context';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Catégories', href: '/categories' },
    { label: 'Promos', href: '/categories?promo=1' },
    { label: 'Mes commandes', href: '/orders' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-warm shadow-warm-1">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo avec Admin Masqué sur le point final */}
        <div className="flex items-center gap-2">
          <img src="/rush/assets/mark-red.png" alt="" className="h-7 w-auto" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <div className="font-black text-2xl tracking-tighter text-ink flex items-baseline select-none">
            <Link href="/" className="hover:text-brand transition-colors">
              RUSH
            </Link>
            <Link 
              href="/admin" 
              className="text-brand hover:scale-125 transition-transform cursor-default select-none px-0.5"
              title="Admin Portal"
            >
              .
            </Link>
          </div>
        </div>

        {/* Liens de navigation simplifiés */}
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-bold text-[14.5px] transition-colors hover:text-brand ${
                  active ? 'text-brand' : 'text-ink-light'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions utilisateur & Panier */}
        <div className="flex items-center gap-5">
          <Link
            href="/cart"
            className="relative p-2 text-ink hover:text-brand transition-colors"
          >
            <Icon name="cart" size={24} stroke={2} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-brand text-white text-[9.5px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-brand">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/account"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-brand text-white font-extrabold shadow-brand active:scale-95 transition-transform"
          >
            <Icon name="user" size={18} stroke={2.2} />
          </Link>
        </div>
      </div>
    </header>
  );
};
export default Header;
