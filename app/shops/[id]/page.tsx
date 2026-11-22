'use client';

import React, { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { calculateDistanceKm } from '@/lib/cameroon-geo';
import { productPath } from '@/lib/routes';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/context/cart-context';
import { useRushStore } from '@/context/rush-store-context';
import { useUserLocation } from '@/context/location-context';
import Icon from '@/components/shared/icon';
import SafeImage from '@/components/shared/safe-image';
import ProductCard from '@/components/shared/product-card';
import CameroonMap from '@/components/maps/cameroon-map';

interface ShopDetailProps {
  params: Promise<{ id: string }>;
}

export default function ShopDetailPage({ params }: ShopDetailProps) {
  const router = useRouter();
  const { id } = use(params);
  const { addToCart, cartCount, cartTotal } = useCart();
  const { customProducts, isFavoriteShop, toggleFavoriteShop } = useRushStore();
  const { location: userLoc } = useUserLocation();

  const [selectedCat, setSelectedCat] = useState('all');
  const [query, setQuery] = useState('');
  const [showMap, setShowMap] = useState(false);

  const shop = MOCK_SHOPS.find((s) => s.id === id);

  const shopProducts = useMemo(() => {
    if (!shop) return [];
    return [...customProducts, ...MOCK_PRODUCTS].filter((p) => p.shop_id === shop.id);
  }, [shop, customProducts]);

  const categoriesInShop = useMemo(() => {
    const ids = new Set(shopProducts.map((p) => p.category_id).filter(Boolean));
    return MOCK_CATEGORIES.filter((c) => ids.has(c.id));
  }, [shopProducts]);

  const filteredProducts = useMemo(() => {
    return shopProducts.filter((p) => {
      const okCat = selectedCat === 'all' || p.category_id === selectedCat;
      const q = query.trim().toLowerCase();
      const okQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sub && p.sub.toLowerCase().includes(q));
      return okCat && okQ;
    });
  }, [shopProducts, selectedCat, query]);

  if (!shop) {
    return (
      <div className="page-enter flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon name="bag" size={30} stroke={1.9} />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink">Boutique introuvable</h1>
        <p className="mt-2 max-w-md text-[14px] font-semibold leading-relaxed text-ink-light">
          Cette boutique partenaire n’est pas disponible ou l’adresse est incorrecte.
        </p>
        <button
          onClick={() => router.push('/categories')}
          className="mt-6 flex h-11 items-center justify-center rounded-pill bg-ink px-6 text-[13px] font-black text-white shadow-warm-1 cursor-pointer"
        >
          Explorer les produits
        </button>
      </div>
    );
  }

  const fav = isFavoriteShop(shop.id);
  const shopLat = shop.lat ?? 4.0548;
  const shopLng = shop.lng ?? 9.7012;
  const distanceKm = calculateDistanceKm(userLoc.lat, userLoc.lng, shopLat, shopLng);
  const dynamicEta = Math.max(15, Math.round(12 + distanceKm * 4));

  return (
    <div className="page-enter flex flex-col gap-6 pb-24 md:pb-12">
      {/* Bannière Boutique */}
      <section className="relative overflow-hidden rounded-b-[28px] md:rounded-[28px] md:mt-5 bg-ink text-white shadow-warm-2">
        <div className="relative h-48 md:h-64 w-full">
          <SafeImage
            src={shop.cover_image_url}
            alt={shop.name}
            fallbackIcon={shop.glyph}
            fallbackTint={shop.tint}
            radius="0px"
            aspectRatio="video"
            className="h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140E0D] via-[#140E0D]/55 to-black/25" />

          {/* Top Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface text-ink shadow-warm-2 flex items-center justify-center cursor-pointer"
              aria-label="Retour"
            >
              <Icon name="chevL" size={20} stroke={2.4} />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMap((v) => !v)}
                className="h-10 px-3.5 rounded-pill bg-surface/95 text-ink text-[12px] font-black shadow-warm-2 flex items-center gap-1.5 cursor-pointer hover:text-brand"
              >
                <Icon name="pin" size={14} stroke={2.3} className="text-brand" />
                {showMap ? 'Masquer la carte' : 'Localiser'}
              </button>
              <button
                type="button"
                onClick={() => toggleFavoriteShop(shop.id, shop.name)}
                className="w-10 h-10 rounded-full bg-surface text-ink shadow-warm-2 flex items-center justify-center cursor-pointer"
                aria-label="Favori"
              >
                <Icon
                  name="heart"
                  size={18}
                  style={{
                    fill: fav ? 'var(--red)' : 'none',
                    color: fav ? 'var(--red)' : 'var(--ink)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="relative px-5 pb-6 pt-3 md:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-[18px] border-2 border-surface bg-surface overflow-hidden shadow-warm-3 -mt-10 z-20 flex-none">
              <SafeImage
                src={shop.logo_url}
                alt={shop.name}
                fallbackIcon={shop.glyph}
                fallbackTint={shop.tint}
                radius="14px"
                className="h-full w-full"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-pill bg-success px-2.5 py-0.5 text-[10.5px] font-black text-white">
                  Ouvert · 07h30–22h30
                </span>
                {shop.promo && (
                  <span className="rounded-pill bg-brand px-2.5 py-0.5 text-[10.5px] font-black text-white">
                    {shop.promo}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1.5">{shop.name}</h1>
              <p className="text-[13px] font-semibold text-white/75 mt-0.5">
                {shop.category} · {shop.quarter || 'Akwa'}, {shop.city || 'Douala'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[12.5px] font-extrabold">
            <span className="flex items-center gap-1 rounded-pill bg-white/10 px-3 py-1.5">
              <Icon name="star" size={13} stroke={0} style={{ fill: 'var(--amber)', color: 'var(--amber)' }} />
              {shop.rating} ({shop.reviews_count})
            </span>
            <span className="flex items-center gap-1 rounded-pill bg-white/10 px-3 py-1.5">
              <Icon name="clock" size={13} className="text-brand" />
              {dynamicEta} min ({distanceKm} km)
            </span>
            <span className="flex items-center gap-1 rounded-pill bg-white/10 px-3 py-1.5">
              <Icon name="truck" size={13} className="text-success" />
              {shop.delivery_fee === 0 ? 'Livraison gratuite' : formatPrice(shop.delivery_fee)}
            </span>
          </div>
        </div>
      </section>

      {/* Carte d'itinéraire Boutique -> Position Client */}
      {showMap && (
        <section className="px-4 md:px-0 animate-scaleUp">
          <CameroonMap
            center={[shopLat, shopLng]}
            zoom={14}
            fitMarkers
            useRoadRouting
            showLayerToggle
            heightClassName="h-[280px]"
            interactiveHint={`Distance depuis ${userLoc.zoneName} : ${distanceKm} km (~${dynamicEta} min)`}
            markers={[
              {
                id: `store-${shop.id}`,
                lat: shopLat,
                lng: shopLng,
                title: shop.name,
                subtitle: `${shop.quarter || 'Douala'} · ${shop.category}`,
                badge: 'Boutique',
                variant: 'shop',
              },
              {
                id: 'store-user-loc',
                lat: userLoc.lat,
                lng: userLoc.lng,
                title: `Votre position (${userLoc.zoneName})`,
                subtitle: userLoc.address,
                badge: 'Livraison',
                variant: 'customer',
                pulse: true,
              },
            ]}
            routes={[
              {
                id: `route-${shop.id}`,
                points: [
                  [shopLat, shopLng],
                  [userLoc.lat, userLoc.lng],
                ],
                color: '#F50012',
                dashed: true,
                weight: 4,
              },
            ]}
          />
        </section>
      )}

      {/* Recherche + Filtres dans la boutique */}
      <section className="px-4 md:px-0 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex items-center bg-surface rounded-md px-3.5 h-11 border border-border-warm flex-1 max-w-md focus-within:ring-2 focus-within:ring-brand">
            <Icon name="search" size={18} className="text-ink-placeholder" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Rechercher dans ${shop.name}...`}
              className="w-full bg-transparent border-none outline-none font-semibold text-[13.5px] ml-2 text-ink"
            />
          </div>

          <div className="hide-scroll flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`flex-none h-9 px-3.5 rounded-pill font-extrabold text-[12px] cursor-pointer ${
                selectedCat === 'all' ? 'bg-ink text-white' : 'bg-surface border border-border-warm text-ink-light'
              }`}
            >
              Tout ({shopProducts.length})
            </button>
            {categoriesInShop.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCat(c.id)}
                className={`flex-none h-9 px-3.5 rounded-pill font-extrabold text-[12px] cursor-pointer ${
                  selectedCat === c.id ? 'bg-ink text-white' : 'bg-surface border border-border-warm text-ink-light'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catalogue Boutique */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onOpen={(prod) => router.push(productPath(prod.id))}
                onAdd={(prod, e) => {
                  e.stopPropagation();
                  addToCart(prod, 1);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="card bg-surface p-8 rounded-[20px] border border-border-warm text-center">
            <p className="text-[14px] font-bold text-ink-muted">Aucun article trouvé dans cette section.</p>
          </div>
        )}
      </section>

      {/* Barre panier flottante si des articles sont dans le panier */}
      {cartCount > 0 && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-30">
          <Link
            href="/cart"
            className="flex items-center justify-between rounded-pill bg-brand px-5 h-12 text-white font-black shadow-brand hover:bg-brand-hover transition-colors"
          >
            <span className="flex items-center gap-2 text-[13px]">
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">{cartCount}</span>
              Voir mon panier
            </span>
            <span className="text-[14px]">{formatPrice(cartTotal)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
