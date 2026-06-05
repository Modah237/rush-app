'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productPath } from '@/lib/routes';
import { useCart } from '@/context/cart-context';
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import Icon from '@/components/shared/icon';
import ProductMini from '@/components/shared/product-mini';
import ProductCard from '@/components/shared/product-card';
import ShopCard from '@/components/shared/shop-card';
import SafeImage from '@/components/shared/safe-image';

export default function Home() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const popularProducts = MOCK_PRODUCTS.slice(0, 8);
  const promoProducts = MOCK_PRODUCTS.filter((p) => p.old_price).slice(0, 4);
  const heroProducts = MOCK_PRODUCTS.slice(0, 3);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/categories?q=${encodeURIComponent(query)}` : '/categories');
  };

  const promoBanners = [
    {
      id: 'rush25',
      badge: '-25%',
      title: 'Votre première commande allégée.',
      subtitle: 'Courses fraîches, repas et essentiels livrés à Akwa, Bonapriso et Deido.',
      cta: 'Voir les offres',
      image: '/rush/home/banner-promo-1.jpg',
      tone: 'bg-[#1A1413]',
    },
    {
      id: 'momo',
      badge: 'MoMo / OM',
      title: 'Payez simple, recevez vite.',
      subtitle: 'MTN MoMo, Orange Money et suivi live de votre commande RUSH.',
      cta: 'Commander',
      image: '/rush/home/banner-promo-2.jpg',
      tone: 'bg-[#0B3A26]',
    },
    {
      id: 'month',
      badge: 'Packs du mois',
      title: 'Riz, huile, eau et œufs réunis.',
      subtitle: 'Les essentiels de la maison sans détour au marché.',
      cta: 'Découvrir',
      image: '/rush/home/banner-promo-3.jpg',
      tone: 'bg-[#5B2508]',
    },
  ];

  const categories = [
    { id: 'epicerie', label: 'Courses', glyph: 'basket', tint: '#FFE9EB', ink: '#F50012' },
    { id: 'resto', label: 'Repas', glyph: 'bowl', tint: '#FFF1E2', ink: '#E2730B' },
    { id: 'boissons', label: 'Boissons', glyph: 'bottle', tint: '#E8F1FF', ink: '#2563EB' },
    { id: 'fruits', label: 'Marché frais', glyph: 'leaf', tint: '#E6F6EC', ink: '#15A05A' },
    { id: 'pharmacie', label: 'Pharmacie', glyph: 'heart', tint: '#FDF2F8', ink: '#DB2777' },
    { id: 'maison', label: 'Maison', glyph: 'spray', tint: '#F0ECFF', ink: '#6D4AE0' },
    { id: 'colis', label: 'Colis', glyph: 'pkg', tint: '#FEF3C7', ink: '#D97706' },
    { id: 'promos', label: 'Promos', glyph: 'flame', tint: '#FFEBD3', ink: '#FF6B00' },
  ];

  return (
    <div className="page-enter flex flex-col gap-7 pb-8 md:gap-8 md:pb-10">
      {/* Refined Premium Hero Section */}
      <section className="relative overflow-hidden rounded-b-[32px] bg-[#140E0D] text-white shadow-warm-3 md:mt-5 md:rounded-[32px]">
        {/* Decorative background grids & gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(245,0,18,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,14,13,0)_60%,rgba(20,14,13,0.85)_100%)]" />
        
        <div className="relative grid gap-8 px-5 pb-8 pt-6 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-10 md:px-12 md:py-16 lg:px-16">
          {/* Left Column: Copy & Actions */}
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex items-center justify-between md:block">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-white shadow-brand">
                <Icon name="truck" size={14} stroke={2.3} />
                Livraison RUSH Douala
              </span>
              <Link href="/account" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white md:hidden">
                <Icon name="user" size={18} stroke={2.2} />
              </Link>
            </div>

            <div className="max-w-[620px]">
              <h1 className="text-[36px] sm:text-[46px] md:text-[58px] font-black leading-[1.02] tracking-tight">
                Votre quartier livré maintenant.
              </h1>
              <p className="mt-4 max-w-[500px] text-[16px] font-bold leading-relaxed text-white/70 md:text-[18px]">
                Courses, repas et essentiels livrés rapidement à Douala.
              </p>
            </div>

            {/* Responsive Search Form */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row max-w-[580px]">
              <div className="flex h-14 flex-1 items-center gap-2.5 rounded-[16px] bg-white px-3.5 text-ink shadow-warm-3 ring-1 ring-white/10">
                <Icon name="search" size={20} className="text-ink-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Que voulez-vous recevoir aujourd'hui ?"
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] font-bold text-ink outline-none placeholder:text-ink-muted"
                />
                <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-app-light text-ink-light hover:text-brand" title="Micro">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                    <path d="M12 19v3" />
                  </svg>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-app-light text-ink-light hover:text-brand" title="Caméra">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
              </div>
              <button className="flex h-14 items-center justify-center gap-2 rounded-[16px] bg-brand px-6 text-[14.5px] font-black text-white shadow-brand hover:bg-brand-hover active:scale-[0.98] transition-all whitespace-nowrap">
                Commander maintenant
                <Icon name="arrowR" size={17} stroke={2.4} />
              </button>
            </form>

            {/* Quick Badges below Search */}
            <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[12px] font-black text-white/90">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 border border-white/5 backdrop-blur-md">
                <Icon name="clock" size={14} className="text-brand" stroke={2.5} />
                25 min
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 border border-white/5 backdrop-blur-md">
                <Icon name="wallet" size={14} className="text-success" stroke={2.5} />
                Mobile Money
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 border border-white/5 backdrop-blur-md">
                <Icon name="pkg" size={14} className="text-info" stroke={2.5} />
                Suivi live
              </span>
            </div>
          </div>

          {/* Right Column: Premium Visual Composition (Desktop/Tablet) */}
          <div className="hidden md:block relative h-[420px] w-full max-w-[390px] mx-auto select-none overflow-visible">
            {/* Soft background shape */}
            <div 
              className="absolute inset-x-6 bottom-3 top-7 rounded-[32px] border border-white/10" 
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            />
            
            {/* Courier Image Container */}
            <div className="absolute bottom-0 left-1/2 h-[380px] w-[290px] -translate-x-1/2 overflow-hidden rounded-[28px] bg-[#231A18] shadow-warm-3 border border-white/10">
              <img src="/rush/rider/courier-hero.jpg" alt="Livreur RUSH avec sac de livraison" className="h-full w-full object-cover" />
            </div>

            {/* Card 1: 25 min (Top-Left) */}
            <div className="absolute top-6 -left-4 bg-white text-ink p-3 rounded-[18px] shadow-warm-3 border border-border-warm-light/40 flex items-center gap-3 z-20 w-[164px]">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-tint text-brand">
                <Icon name="clock" size={17} stroke={2.3} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-ink-muted uppercase leading-none">Arrivée estimée</div>
                <div className="text-[14px] font-black text-brand mt-0.5 leading-none">25 min</div>
              </div>
            </div>

            {/* Card 2: Mobile Money (Middle-Right) */}
            <div className="absolute top-[140px] -right-4 bg-white text-ink p-3 rounded-[18px] shadow-warm-3 border border-border-warm-light/40 flex items-center gap-3 z-20 w-[172px]">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-success-tint text-success">
                <Icon name="wallet" size={17} stroke={2.3} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-ink-muted uppercase leading-none">Paiement</div>
                <div className="text-[13px] font-black text-success mt-0.5 leading-tight truncate">MoMo & Orange</div>
              </div>
            </div>

            {/* Card 3: Suivi live (Bottom-Left) */}
            <div className="absolute bottom-6 -left-2 bg-white text-ink p-3 rounded-[18px] shadow-warm-3 border border-border-warm-light/40 flex items-center gap-3 z-20 w-[164px]">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-info/10 text-info">
                <Icon name="pkg" size={17} stroke={2.3} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold text-ink-muted uppercase leading-none">Statut commande</div>
                <div className="text-[13px] font-black text-info mt-0.5 leading-tight truncate">Suivi live</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h2 className="text-lg font-black tracking-tight text-ink">Catégories populaires</h2>
          <Link href="/categories" className="flex items-center gap-0.5 text-[13px] font-bold text-brand">
            Tout voir <Icon name="chevR" size={13} stroke={2.4} />
          </Link>
        </div>
        <div className="hide-scroll flex gap-3.5 overflow-x-auto px-4 pb-1 md:px-0">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => router.push(category.id === 'promos' ? '/promos' : `/categories?cat=${category.id}`)}
              className="group flex w-[82px] flex-none cursor-pointer flex-col items-center gap-2"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-border-warm-light/70 shadow-warm-1 transition-transform group-hover:scale-105" style={{ backgroundColor: category.tint, color: category.ink }}>
                <Icon name={category.glyph} size={29} stroke={1.9} />
              </span>
              <span className="h-[30px] text-center text-[12px] font-extrabold leading-tight text-ink-light">{category.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Redesigned Premium Promotion Banners */}
      <section className="grid gap-4 px-4 md:grid-cols-3 md:px-0">
        {promoBanners.map((banner) => (
          <button
            key={banner.id}
            onClick={() => router.push('/promos')}
            className={`${banner.tone} group relative min-h-[180px] overflow-hidden rounded-[24px] p-5 text-left text-white shadow-warm-2 border border-white/5 hover:scale-[1.01] transition-all duration-200`}
          >
            {/* Image card aligned to the right (never overlays text) */}
            <div className="absolute inset-y-0 right-0 w-[42%] flex items-center justify-center p-3">
              <div className="h-full w-full relative rounded-[18px] overflow-hidden shadow-warm-2 border border-white/10 bg-white/5">
                <SafeImage src={banner.image} alt={banner.title} radius="18px" className="h-full w-full object-cover" />
              </div>
            </div>
            
            {/* Content text on the left */}
            <div className="relative z-10 flex h-full max-w-[56%] flex-col items-start justify-between gap-4">
              <span className="rounded-pill bg-brand px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-brand">
                {banner.badge}
              </span>
              <div>
                <h3 className="text-[19px] font-black leading-tight tracking-tight">{banner.title}</h3>
                <p className="mt-1.5 text-[12.5px] font-bold leading-snug text-white/70 line-clamp-2">{banner.subtitle}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-black text-ink shadow-sm group-hover:translate-x-0.5 transition-transform">
                {banner.cta}
                <Icon name="chevR" size={11} stroke={2.5} />
              </span>
            </div>
          </button>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h2 className="text-lg font-black tracking-tight text-ink">Produits populaires près de vous</h2>
          <Link href="/categories" className="flex items-center gap-0.5 text-[13px] font-bold text-brand">
            Tout voir <Icon name="chevR" size={13} stroke={2.4} />
          </Link>
        </div>
        <div className="hide-scroll flex gap-3.5 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-8">
          {popularProducts.map((product) => (
            <ProductMini
              key={product.id}
              p={product}
              onOpen={(p) => router.push(productPath(p.id))}
              onAdd={(p, e) => {
                e.stopPropagation();
                addToCart(p, 1);
              }}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h2 className="text-lg font-black tracking-tight text-ink">Boutiques proches</h2>
          <button className="flex items-center gap-1 text-[13px] font-bold text-brand">
            Voir sur la carte <Icon name="pin" size={12} stroke={2} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-0">
          {MOCK_SHOPS.slice(0, 3).map((shop) => (
            <ShopCard key={shop.id} s={shop} onOpen={() => router.push('/categories')} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 md:px-0">
          <h2 className="text-lg font-black tracking-tight text-ink">Promotions & bonnes affaires</h2>
          <span className="rounded-pill bg-brand-tint px-2.5 py-1 text-[11px] font-black text-brand">
            {MOCK_PRODUCTS.filter((p) => p.old_price).length} réductions
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 px-4 md:grid-cols-4 md:px-0">
          {promoProducts.map((product) => (
            <ProductCard
              key={product.id}
              p={product}
              onOpen={(p) => router.push(productPath(p.id))}
              onAdd={(p, e) => {
                e.stopPropagation();
                addToCart(p, 1);
              }}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 px-4 md:grid-cols-3 md:px-0">
        {[
          { icon: 'truck', title: 'Choisissez', text: 'Parcourez les catégories et ajoutez vos articles préférés.' },
          { icon: 'wallet', title: 'Payez simple', text: 'Réglez par MTN MoMo, Orange Money ou cash à la livraison.' },
          { icon: 'headset', title: 'Recevez vite', text: 'Un Rusher récupère et livre votre commande en 25 minutes.' },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-3 rounded-[20px] border border-border-warm-light bg-surface p-4 shadow-warm-1">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[15px] bg-brand-tint text-brand">
              <Icon name={item.icon} size={22} stroke={2.1} />
            </span>
            <div>
              <div className="text-[15px] font-black text-ink">{item.title}</div>
              <div className="mt-0.5 text-[13px] font-semibold leading-snug text-ink-light">{item.text}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Join RUSH Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-ink px-4 md:px-0">Rejoindre RUSH</h2>
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-3 md:px-0">
          <div className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-tint text-brand mb-3">
                <Icon name="bag" size={20} />
              </span>
              <h3 className="font-black text-[16px] text-ink">merchant.rush</h3>
              <p className="text-[12.5px] font-semibold text-ink-light mt-1.5 leading-relaxed">
                Développez vos ventes à Douala. Mettez vos produits en ligne et recevez des commandes payées par MoMo.
              </p>
            </div>
            <Link href="/merchant" className="mt-4 text-[13px] font-black text-brand hover:underline flex items-center gap-1">
              Devenir partenaire <Icon name="chevR" size={12} stroke={2.4} />
            </Link>
          </div>

          <div className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-green-tint text-success mb-3">
                <Icon name="truck" size={20} />
              </span>
              <h3 className="font-black text-[16px] text-ink">rider.rush</h3>
              <p className="text-[12.5px] font-semibold text-ink-light mt-1.5 leading-relaxed">
                Devenez Rusher. Livrez des courses ou repas à moto et gagnez des revenus réguliers avec une assistance locale.
              </p>
            </div>
            <Link href="/rider" className="mt-4 text-[13px] font-black text-success hover:underline flex items-center gap-1">
              Devenir Rusher <Icon name="chevR" size={12} stroke={2.4} />
            </Link>
          </div>

          <div className="card bg-surface p-5 rounded-[20px] border border-border-warm-light shadow-warm-1 flex flex-col justify-between min-h-[180px]">
            <div>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-info/10 text-info mb-3">
                <Icon name="pkg" size={20} />
              </span>
              <h3 className="font-black text-[16px] text-ink">drive.rush</h3>
              <p className="text-[12.5px] font-semibold text-ink-light mt-1.5 leading-relaxed">
                Livraison à la demande pour votre commerce WhatsApp ou Instagram. Sans gérer de flotte de motos.
              </p>
            </div>
            <Link href="/drive" className="mt-4 text-[13px] font-black text-info hover:underline flex items-center gap-1">
              Utiliser drive.rush <Icon name="chevR" size={12} stroke={2.4} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
