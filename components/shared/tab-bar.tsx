'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
import { useCart } from '@/context/cart-context';

export const TabBar: React.FC = () => {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const items = [
    { id: 'home', icon: 'home', label: 'Accueil', href: '/' },
    { id: 'category', icon: 'grid', label: 'Catégories', href: '/categories' },
    { id: 'cart', icon: 'cart', label: 'Panier', href: '/cart', count: cartCount },
    { id: 'orders', icon: 'pkg', label: 'Commandes', href: '/orders' },
    { id: 'account', icon: 'user', label: 'Compte', href: '/account' },
  ];

  // Vérifier si un item est actif
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Cacher la TabBar sur les pages de checkout, de confirmation, ou sur l'espace d'administration
  const shouldHide = 
    pathname.startsWith('/checkout') || 
    pathname.startsWith('/admin') ||
    pathname.startsWith('/merchant') ||
    pathname.startsWith('/courier') ||
    pathname.includes('/confirm');

  if (shouldHide) return null;

  return (
    <nav className="md:hidden fixed left-0 right-0 bottom-0 height-[86px] z-40 bg-surface/86 backdrop-blur-xl border-t border-border-warm flex items-start justify-around px-3.5 pt-2.5 pb-safe shadow-warm-2">
      {items.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.id}
            href={it.href}
            className={`flex flex-col items-center gap-1 flex-1 py-1 font-bold text-[10.5px] relative transition-colors ${
              active ? 'text-brand' : 'text-ink-placeholder'
            }`}
          >
            <span className={`transition-transform duration-200 ${active ? 'translate-y-[-1px]' : ''}`}>
              <Icon name={it.icon} size={23} stroke={active ? 2.1 : 1.8} />
            </span>
            {it.count && it.count > 0 ? (
              <span className="absolute top-[2px] right-[50%] mr-[-22px] bg-brand text-white text-[10px] font-extrabold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-[0_2px_6px_rgba(245,0,18,0.4)]">
                {it.count}
              </span>
            ) : null}
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
export default TabBar;
