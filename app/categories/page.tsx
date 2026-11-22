'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useRushStore } from '@/context/rush-store-context';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { productPath, shopPath } from '@/lib/routes';
import Icon from '@/components/shared/icon';
import ProductCard from '@/components/shared/product-card';
import EmptyState from '@/components/shared/empty-state';

function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const { customProducts, favoriteProductIds } = useRushStore();

  const queryParam = searchParams.get('q') || '';
  const catParam = searchParams.get('cat') || 'all';
  const shopParam = searchParams.get('shop') || 'all';

  const [cat, setCat] = useState(catParam);
  const [shopId, setShopId] = useState(shopParam);
  const [sort, setSort] = useState('pop');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState(queryParam);
  const [onlyPromos, setOnlyPromos] = useState(false);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [onlyFast, setOnlyFast] = useState(false);
  const [onlyFreeShip, setOnlyFreeShip] = useState(false);
  const [maxBudget, setMaxBudget] = useState<number | null>(null);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setCat(catParam);
  }, [catParam]);

  useEffect(() => {
    setShopId(shopParam);
  }, [shopParam]);

  const chips = [{ id: 'all', label: 'Tout' }, ...MOCK_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];
  const sortLabels: Record<string, string> = {
    pop: 'Populaire',
    price_asc: 'Prix croissant',
    price_desc: 'Prix décroissant',
    rating: 'Mieux notés',
    discount: 'Meilleure remise',
  };

  const allProducts = [...customProducts, ...MOCK_PRODUCTS];

  let list = allProducts.filter((p) => {
    const prodShop = MOCK_SHOPS.find((s) => s.id === p.shop_id);
    const matchesCat = cat === 'all' || p.category_id === cat;
    const matchesShop = shopId === 'all' || p.shop_id === shopId;
    const matchesPromo = !onlyPromos || Boolean(p.old_price && p.old_price > p.price);
    const matchesFav = !onlyFavs || favoriteProductIds.includes(p.id);
    const matchesFast = !onlyFast || (prodShop ? prodShop.eta_minutes <= 25 : false);
    const matchesFree = !onlyFreeShip || (prodShop ? prodShop.delivery_fee === 0 : false);
    const matchesBudget = maxBudget === null || p.price <= maxBudget;
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      (p.sub && p.sub.toLowerCase().includes(query.toLowerCase())) ||
      (p.shop_name && p.shop_name.toLowerCase().includes(query.toLowerCase()));
    return matchesCat && matchesShop && matchesPromo && matchesFav && matchesFast && matchesFree && matchesBudget && matchesQuery;
  });

  if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
  if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
  if (sort === 'discount') {
    list = [...list].sort((a, b) => {
      const discA = a.old_price ? 1 - a.price / a.old_price : 0;
      const discB = b.old_price ? 1 - b.price / b.old_price : 0;
      return discB - discA;
    });
  }

  const updateUrl = (nextCat: string, nextQuery: string, nextShop: string) => {
    const params = new URLSearchParams();
    if (nextCat && nextCat !== 'all') params.set('cat', nextCat);
    if (nextShop && nextShop !== 'all') params.set('shop', nextShop);
    if (nextQuery) params.set('q', nextQuery);
    const qs = params.toString();
    router.replace(qs ? `/categories?${qs}` : '/categories');
  };

  const handleCategorySelect = (id: string) => {
    setCat(id);
    updateUrl(id, query, shopId);
  };

  const handleShopSelect = (id: string) => {
    setShopId(id);
    updateUrl(cat, query, id);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    updateUrl(cat, val, shopId);
  };

  const resetAllFilters = () => {
    setCat('all');
    setShopId('all');
    setQuery('');
    setOnlyPromos(false);
    setOnlyFavs(false);
    setOnlyFast(false);
    setOnlyFreeShip(false);
    setMaxBudget(null);
    setSort('pop');
    router.replace('/categories');
  };

  const selectedShop = MOCK_SHOPS.find((s) => s.id === shopId);

  return (
    <div className="page-enter flex flex-col min-h-screen bg-bg-app">
      {/* Header collant de recherche & filtres */}
      <div className="sticky top-0 md:top-16 z-30 bg-surface border-b border-border-warm py-3 px-4 md:px-0 shadow-warm-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-extrabold text-ink-placeholder tracking-widest uppercase">
              <span>{selectedShop ? selectedShop.name : 'Explorer'}</span>
              {selectedShop && (
                <Link href={shopPath(selectedShop.id)} className="text-brand normal-case tracking-normal hover:underline">
                  Voir la vitrine →
                </Link>
              )}
            </div>
            <h1 className="font-black text-xl text-ink tracking-tight mt-0.5">
              {cat === 'all' ? 'Tous les produits' : MOCK_CATEGORIES.find((c) => c.id === cat)?.label || 'Produits'}
            </h1>
          </div>
          <LinkToCart />
        </div>

        {/* Barre de saisie de recherche */}
        <div className="relative flex items-center bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
          <Icon name="search" size={19} className="text-ink-placeholder" />
          <input
            type="text"
            placeholder="Rechercher un produit, une boutique…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full bg-transparent border-none outline-none font-semibold text-[14.5px] ml-2 text-ink"
          />
          {query && (
            <button onClick={() => handleQueryChange('')} className="text-ink-placeholder cursor-pointer">
              <Icon name="x" size={18} />
            </button>
          )}
        </div>

        {/* Chips horizontales de catégories */}
        <div className="hide-scroll flex gap-2 overflow-x-auto pb-0.5">
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c.id)}
              className={`flex-none h-[34px] px-4 rounded-pill font-bold text-[13px] transition-colors cursor-pointer ${
                cat === c.id ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light hover:bg-border-warm-light'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Filtres avancés (Boutique, Promos, Favoris, Budget) */}
        <div className="hide-scroll flex items-center gap-2 overflow-x-auto pb-0.5">
          <select
            value={shopId}
            onChange={(e) => handleShopSelect(e.target.value)}
            className="h-8 px-3 rounded-pill bg-bg-app-light border border-border-warm text-[12px] font-bold text-ink outline-none cursor-pointer"
          >
            <option value="all">Toutes boutiques</option>
            {MOCK_SHOPS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyPromos((v) => !v)}
            className={`flex-none h-8 px-3 rounded-pill text-[12px] font-extrabold border cursor-pointer transition-colors ${
              onlyPromos ? 'bg-brand text-white border-brand' : 'bg-bg-app-light text-ink-light border-border-warm'
            }`}
          >
            Promos
          </button>

          <button
            type="button"
            onClick={() => setOnlyFavs((v) => !v)}
            className={`flex-none h-8 px-3 rounded-pill text-[12px] font-extrabold border cursor-pointer transition-colors ${
              onlyFavs ? 'bg-brand text-white border-brand' : 'bg-bg-app-light text-ink-light border-border-warm'
            }`}
          >
            Favoris
          </button>

          <button
            type="button"
            onClick={() => setOnlyFast((v) => !v)}
            className={`flex-none h-8 px-3 rounded-pill text-[12px] font-extrabold border cursor-pointer transition-colors ${
              onlyFast ? 'bg-success text-white border-success' : 'bg-bg-app-light text-ink-light border-border-warm'
            }`}
          >
            &le; 25 min
          </button>

          <button
            type="button"
            onClick={() => setOnlyFreeShip((v) => !v)}
            className={`flex-none h-8 px-3 rounded-pill text-[12px] font-extrabold border cursor-pointer transition-colors ${
              onlyFreeShip ? 'bg-success text-white border-success' : 'bg-bg-app-light text-ink-light border-border-warm'
            }`}
          >
            Livraison gratuite
          </button>

          {[2000, 5000, 10000].map((budget) => (
            <button
              key={budget}
              type="button"
              onClick={() => setMaxBudget((prev) => (prev === budget ? null : budget))}
              className={`flex-none h-8 px-3 rounded-pill text-[12px] font-extrabold border cursor-pointer transition-colors ${
                maxBudget === budget
                  ? 'bg-ink text-white border-ink'
                  : 'bg-bg-app-light text-ink-light border-border-warm'
              }`}
            >
              ≤ {budget.toLocaleString('fr-FR')} F
            </button>
          ))}
        </div>
      </div>

      {/* Grille des résultats */}
      <div className="flex-1 flex flex-col pb-24">
        <div className="flex items-center justify-between px-4 md:px-0 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[13.5px] text-ink-muted">{list.length} résultats</span>
            {(cat !== 'all' || shopId !== 'all' || onlyPromos || onlyFavs || maxBudget !== null || query) && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-[11.5px] font-black text-brand hover:underline cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <button
            onClick={() => setSortOpen(true)}
            className="badge bg-bg-app-light text-ink-light font-extrabold text-[12.5px] px-3 py-1.5 rounded-pill flex items-center gap-1.5 cursor-pointer hover:bg-border-warm-light"
          >
            <Icon name="filter" size={14} stroke={2.2} />
            {sortLabels[sort]}
            <Icon name="chevD" size={13} stroke={2.4} />
          </button>
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon="search"
            title="Aucun résultat"
            text="Essayez un autre mot-clé ou réinitialisez les filtres actifs."
            cta="Réinitialiser"
            onCta={resetAllFilters}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-0">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                p={p}
                onOpen={(product) => router.push(productPath(product.id))}
                onAdd={(product) => addToCart(product, 1)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale Bottom Sheet pour le tri */}
      {sortOpen && (
        <>
          <div className="fixed inset-0 bg-ink/50 z-50 animate-fadeIn" onClick={() => setSortOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-surface rounded-t-xl z-51 p-5 pb-8 animate-sheetUp shadow-warm-3">
            <div className="w-10 h-1 bg-border-warm rounded-full mx-auto mb-4" />
            <h3 className="font-black text-lg text-ink mb-3">Trier par</h3>
            <div className="flex flex-col">
              {Object.entries(sortLabels).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => {
                    setSort(k);
                    setSortOpen(false);
                  }}
                  className="flex items-center justify-between w-full py-4 border-b border-border-warm-light cursor-pointer text-left"
                >
                  <span className={`font-bold text-[15px] ${sort === k ? 'text-brand' : 'text-ink'}`}>{v}</span>
                  {sort === k && <Icon name="check" size={20} stroke={2.6} className="text-brand" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LinkToCart() {
  const { cartCount } = useCart();
  return (
    <Link
      href="/cart"
      className="md:hidden w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink relative"
    >
      <Icon name="cart" size={21} />
      {cartCount > 0 && (
        <span className="absolute top-0 right-0 bg-brand text-white text-[9px] font-black min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="sk-anim w-12 h-12 rounded-full" />
        </div>
      }
    >
      <CategoriesContent />
    </Suspense>
  );
}
