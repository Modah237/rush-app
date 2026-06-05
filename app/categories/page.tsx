'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data';
import { Product } from '@/types';
import Icon from '@/components/shared/icon';
import ProductCard from '@/components/shared/product-card';
import EmptyState from '@/components/shared/empty-state';


function CategoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  
  const queryParam = searchParams.get('q') || '';
  const catParam = searchParams.get('cat') || 'all';

  const [cat, setCat] = useState(catParam);
  const [sort, setSort] = useState('pop');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState(queryParam);

  // Synchroniser avec les query params de l'URL
  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    setCat(catParam);
  }, [catParam]);

  const chips = [{ id: 'all', label: 'Tout' }, ...MOCK_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];
  const sortLabels: Record<string, string> = { 
    pop: 'Populaire', 
    price_asc: 'Prix croissant', 
    price_desc: 'Prix décroissant', 
    rating: 'Mieux notés' 
  };

  // Filtrer les produits
  let list = MOCK_PRODUCTS.filter((p) => {
    const matchesCat = cat === 'all' || p.category_id === cat;
    const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase()) || (p.sub && p.sub.toLowerCase().includes(query.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Trier les produits
  if (sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price);
  if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);

  const handleCategorySelect = (id: string) => {
    setCat(id);
    router.replace(`/categories?cat=${id}${query ? `&q=${encodeURIComponent(query)}` : ''}`);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    router.replace(`/categories?cat=${cat}${val ? `&q=${encodeURIComponent(val)}` : ''}`);
  };

  return (
    <div className="page-enter flex flex-col min-h-screen bg-bg-app">
      {/* Header collant de recherche */}
      <div className="sticky top-0 md:top-16 z-30 bg-surface border-b border-border-warm py-3 px-4 md:px-0 shadow-warm-1 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-extrabold text-ink-placeholder tracking-widest uppercase">Explorer</div>
            <h1 className="font-black text-xl text-ink tracking-tight mt-0.5">
              {cat === 'all' ? 'Tous les produits' : MOCK_CATEGORIES.find(c => c.id === cat)?.label || 'Produits'}
            </h1>
          </div>
          <LinkToCart />
        </div>

        {/* Barre de saisie de recherche */}
        <div className="relative flex items-center bg-bg-app-light rounded-md px-3.5 h-11 border border-border-warm focus-within:ring-2 focus-within:ring-brand focus-within:bg-surface transition-all">
          <Icon name="search" size={19} className="text-ink-placeholder" />
          <input 
            type="text"
            placeholder="Rechercher un produit…" 
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
                cat === c.id 
                  ? 'bg-ink text-white' 
                  : 'bg-bg-app-light text-ink-light hover:bg-border-warm-light'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des résultats */}
      <div className="flex-1 flex flex-col pb-24">
        <div className="flex items-center justify-between px-4 md:px-0 py-3.5">
          <span className="font-extrabold text-[13.5px] text-ink-muted">{list.length} résultats</span>
          
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
            text="Essayez un autre mot-clé ou sélectionnez une autre catégorie." 
            cta="Réinitialiser"
            onCta={() => { handleQueryChange(''); handleCategorySelect('all'); }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-0">
            {list.map((p) => (
              <ProductCard 
                key={p.id} 
                p={p} 
                onOpen={(product) => router.push(`/products/${product.id}`)}
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
                  onClick={() => { setSort(k); setSortOpen(false); }}
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

// Petit bouton de raccourci panier réactif pour le Header mobile
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

// Wrapper Suspense obligatoire pour useSearchParams dans Next.js App Router
export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="sk-anim w-12 h-12 rounded-full" />
      </div>
    }>
      <CategoriesContent />
    </Suspense>
  );
}
