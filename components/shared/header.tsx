'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './icon';
import { useCart } from '@/context/cart-context';
import { useRushStore } from '@/context/rush-store-context';
import { useUserLocation } from '@/context/location-context';
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { CAMEROON_ZONES } from '@/lib/cameroon-geo';
import { productPath, shopPath } from '@/lib/routes';
import { formatPrice } from '@/lib/utils';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount } = useCart();
  const { location, openPicker, selectZone } = useUserLocation();
  const {
    notifications,
    unreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    customProducts,
    trackEvent,
  } = useRushStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        setNotifOpen(false);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const navLinks = [
    { label: 'Accueil', href: '/' },
    { label: 'Catégories', href: '/categories' },
    { label: 'Carte', href: '/carte' },
    { label: 'Promos', href: '/promos' },
    { label: 'Mes commandes', href: '/orders' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const quickResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    const allProducts = [...customProducts, ...MOCK_PRODUCTS];
    if (!q) {
      return {
        products: allProducts.slice(0, 4),
        shops: MOCK_SHOPS.slice(0, 3),
        zones: CAMEROON_ZONES.slice(0, 3),
      };
    }
    return {
      products: allProducts
        .filter((p) => p.name.toLowerCase().includes(q) || (p.sub && p.sub.toLowerCase().includes(q)))
        .slice(0, 5),
      shops: MOCK_SHOPS.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          (s.quarter && s.quarter.toLowerCase().includes(q))
      ).slice(0, 3),
      zones: CAMEROON_ZONES.filter(
        (z) => z.name.toLowerCase().includes(q) || z.cityName.toLowerCase().includes(q)
      ).slice(0, 4),
    };
  }, [quickQuery, customProducts]);

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-warm shadow-warm-1">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo avec Admin Masqué sur le point final */}
          <div className="flex items-center gap-2">
            <img
              src="/rush/brand/mark-red.png"
              alt=""
              className="h-7 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
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

          {/* Liens de navigation */}
          <nav className="flex items-center gap-7">
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

          {/* Actions utilisateur : Localisation Cameroun, Recherche ⌘K, Notifications, Panier, Compte */}
          <div className="flex items-center gap-2.5 relative">
            <button
              type="button"
              onClick={openPicker}
              className="hidden lg:flex items-center gap-1.5 h-9 px-3 rounded-pill bg-bg-app-light border border-border-warm text-ink hover:text-brand hover:border-brand/40 text-[12px] font-extrabold cursor-pointer transition-colors max-w-[175px]"
              title="Changer de ville / quartier au Cameroun"
            >
              <Icon name="pin" size={13} stroke={2.4} className="text-brand flex-none" />
              <span className="truncate">{location.cityName} · {location.zoneName}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 h-9 px-3 rounded-pill bg-bg-app-light border border-border-warm text-ink-muted hover:text-ink hover:border-brand/30 text-[12.5px] font-bold cursor-pointer transition-colors"
              title="Recherche rapide (Ctrl+K)"
            >
              <Icon name="search" size={15} />
              <span className="hidden lg:inline">Rechercher</span>
              <kbd className="hidden xl:inline-block rounded bg-surface px-1.5 py-0.5 text-[10px] font-black border border-border-warm">
                Ctrl K
              </kbd>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative p-2 text-ink hover:text-brand transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Icon name="bell" size={21} stroke={2} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-brand text-white text-[9.5px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow-brand">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[330px] bg-surface rounded-[20px] border border-border-warm shadow-warm-3 p-3.5 z-50 animate-scaleUp">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border-warm-light">
                    <span className="font-black text-[13.5px] text-ink">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-black text-brand hover:underline cursor-pointer"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto mt-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-[12px] font-semibold text-ink-muted">
                        Aucune notification.
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setNotifOpen(false);
                            if (n.href) router.push(n.href);
                          }}
                          className={`w-full text-left p-2.5 rounded-[12px] transition-colors cursor-pointer ${
                            n.read ? 'hover:bg-bg-app-light' : 'bg-brand-tint/35 hover:bg-brand-tint/55'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-[12.5px] text-ink truncate">{n.title}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-brand flex-none" />}
                          </div>
                          <p className="text-[11.5px] font-semibold text-ink-light mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link href="/cart" className="relative p-2 text-ink hover:text-brand transition-colors">
              <Icon name="cart" size={23} stroke={2} />
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

      {/* Modale Recherche Rapide Globale (Ctrl+K) */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4 animate-fadeIn"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-surface rounded-[22px] border border-border-warm shadow-warm-3 overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = quickQuery.trim();
                trackEvent('search', q || 'all');
                setSearchOpen(false);
                router.push(q ? `/categories?q=${encodeURIComponent(q)}` : '/categories');
              }}
              className="flex items-center gap-3 px-4 h-14 border-b border-border-warm-light"
            >
              <Icon name="search" size={19} className="text-brand" />
              <input
                autoFocus
                type="text"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                placeholder="Produit, boutique, quartier (Akwa, Bastos)..."
                className="flex-1 bg-transparent outline-none font-bold text-[14.5px] text-ink"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[11px] font-black text-ink-muted px-2 py-1 rounded bg-bg-app-light cursor-pointer"
              >
                ESC
              </button>
            </form>

            <div className="max-h-[420px] overflow-y-auto p-4 flex flex-col gap-4">
              {quickResults.products.length > 0 && (
                <div>
                  <div className="text-[10.5px] font-black uppercase tracking-wider text-ink-placeholder mb-2">
                    Produits
                  </div>
                  <div className="flex flex-col gap-1">
                    {quickResults.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          router.push(productPath(p.id));
                        }}
                        className="flex items-center justify-between p-2.5 rounded-[12px] hover:bg-bg-app-light cursor-pointer text-left"
                      >
                        <div>
                          <div className="font-extrabold text-[13.5px] text-ink">{p.name}</div>
                          <div className="text-[11.5px] text-ink-muted font-semibold">{p.shop_name}</div>
                        </div>
                        <span className="font-black text-[13px] text-brand">{formatPrice(p.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quickResults.shops.length > 0 && (
                <div>
                  <div className="text-[10.5px] font-black uppercase tracking-wider text-ink-placeholder mb-2">
                    Boutiques
                  </div>
                  <div className="flex flex-col gap-1">
                    {quickResults.shops.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          router.push(shopPath(s.id));
                        }}
                        className="flex items-center justify-between p-2.5 rounded-[12px] hover:bg-bg-app-light cursor-pointer text-left"
                      >
                        <div>
                          <div className="font-extrabold text-[13.5px] text-ink">{s.name}</div>
                          <div className="text-[11.5px] text-ink-muted font-semibold">
                            {s.category} · {s.quarter}
                          </div>
                        </div>
                        <span className="text-[11.5px] font-black text-success">{s.eta_minutes} min</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quickResults.zones.length > 0 && (
                <div>
                  <div className="text-[10.5px] font-black uppercase tracking-wider text-ink-placeholder mb-2">
                    Zones couvertes Cameroun
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickResults.zones.map((z) => (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => {
                          selectZone(z.id);
                          setSearchOpen(false);
                          router.push('/carte');
                        }}
                        className="px-3 py-1.5 rounded-pill bg-bg-app-light hover:bg-brand-tint hover:text-brand text-[12px] font-bold text-ink-light cursor-pointer transition-colors"
                      >
                        {z.name} · {z.cityName} ({formatPrice(z.deliveryFee)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default Header;
