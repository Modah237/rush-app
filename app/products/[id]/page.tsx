'use client';

import React, { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { MOCK_PRODUCTS, getVariantsForProduct } from '@/lib/mock-data';
import { productPath } from '@/lib/routes';
import { getCategoryTheme } from '@/components/shared/category-theme';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import Stars from '@/components/shared/stars';
import ProductMini from '@/components/shared/product-mini';
import SafeImage from '@/components/shared/safe-image';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { addToCart } = useCart();
  const [fav, setFav] = useState(false);
  const [qty, setQty] = useState(1);

  // Récupérer le produit
  const p = MOCK_PRODUCTS.find((item) => item.id === id);

  // Gérer l'image active pour la galerie
  const [activeImg, setActiveImg] = useState('');

  useEffect(() => {
    if (p) {
      setActiveImg(p.image_url || '');
    }
  }, [p]);

  const variants = p ? getVariantsForProduct(p) : [];
  const [vSel, setVSel] = useState(variants[0]?.id || '');

  // Si le produit n'existe pas
  if (!p) {
    return (
      <div className="page-enter flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint text-brand">
          <Icon name="shield" size={30} stroke={1.9} />
        </span>
        <h1 className="text-2xl font-black tracking-tight text-ink">Produit introuvable</h1>
        <p className="mt-2 max-w-md text-[14px] font-semibold leading-relaxed text-ink-light">
          Ce produit n’est plus disponible ou l’adresse est incorrecte.
        </p>
        <button
          onClick={() => router.push('/categories')}
          className="mt-6 flex h-11 items-center justify-center rounded-pill bg-ink px-6 text-[13px] font-black text-white shadow-warm-1 cursor-pointer"
        >
          Retour aux catégories
        </button>
      </div>
    );
  }


  const theme = getCategoryTheme(p.category_slug);
  const opt = variants.find((o) => o.id === vSel) || variants[0];
  
  const unitPrice = p.price + (opt ? opt.price_delta : 0);
  const totalPrice = unitPrice * qty;

  // Filtrer les produits similaires (même catégorie, sauf lui-même)
  const similarProducts = MOCK_PRODUCTS.filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 5);

  const handleAddToCart = () => {
    addToCart(p, qty, opt);
    // Afficher une notification ou un toast
    router.push('/cart');
  };

  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;

  return (
    <div className="page-enter flex flex-col pb-24 md:pb-8">
      {/* Conteneur principal adaptatif en grille à 2 colonnes sur desktop */}
      <div className="flex flex-col md:flex-row gap-6 md:mt-6 bg-surface md:p-6 md:rounded-xl md:shadow-warm-2">
        
        {/* Colonne gauche : Image du produit */}
        <div 
          className="w-full md:w-1/2 flex-none relative flex flex-col items-center py-6 rounded-b-xl md:rounded-xl shadow-warm-1"
          style={{ background: `radial-gradient(120% 90% at 30% 20%, #fff 0%, ${theme.tint} 75%)` }}
        >
          {/* Actions d'en-tête transparentes */}
          <div className="absolute top-4 left-4 right-4 flex justify-between z-10">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
            >
              <Icon name="chevL" size={22} stroke={2.3} />
            </button>
            <button 
              onClick={() => setFav(!fav)} 
              className="w-10 h-10 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-transform"
            >
              <Icon 
                name="heart" 
                size={20} 
                style={{ 
                  fill: fav ? 'var(--red)' : 'none', 
                  color: fav ? 'var(--red)' : 'var(--ink)' 
                }} 
              />
            </button>
          </div>

          {/* Image Réelle du produit ou Fallback Icon */}
          <div className="relative w-full max-w-[280px] aspect-square my-4 select-none px-4">
            <SafeImage 
              src={activeImg} 
              alt={p.alt_text || p.name} 
              fallbackIcon={p.fallback_icon || p.glyph} 
              fallbackTint={theme.tint} 
              fallbackInk={theme.ink} 
              radius="16px" 
              aspectRatio="square"
            />
          </div>

          {/* Galerie de miniatures s'il y a plus d'une image */}
          {p.gallery && p.gallery.length > 1 && (
            <div className="flex gap-2 justify-center mt-2 px-4 overflow-x-auto hide-scroll w-full max-w-[320px]">
              {p.gallery.map((imgUrl, idx) => {
                const isSelected = activeImg === imgUrl;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(imgUrl)}
                    className={`w-11 h-11 rounded-md overflow-hidden border-2 transition-all flex-none bg-surface cursor-pointer ${
                      isSelected ? 'border-brand scale-105 shadow-sm' : 'border-border-warm hover:border-brand/40'
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Indicateur de pagination (si pas de galerie multiple) */}
          {(!p.gallery || p.gallery.length <= 1) && (
            <div className="flex gap-1.5 justify-center mt-2">
              <span 
                className="h-2 w-5 rounded-full"
                style={{ backgroundColor: theme.ink }}
              />
            </div>
          )}
        </div>

        {/* Colonne droite : Détails, variantes et sélecteurs */}
        <div className="flex-1 px-4 md:px-0 flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-3">
            {/* Badges */}
            <div className="flex items-center gap-2">
              {discount > 0 && (
                <span className="badge badge-promo bg-brand text-white font-extrabold text-[11px] px-2 py-0.5 rounded-pill">
                  -{discount}%
                </span>
              )}
              {p.tag && (
                <span className="badge bg-brand-tint text-brand font-extrabold text-[11px] px-2 py-0.5 rounded-pill">
                  {p.tag}
                </span>
              )}
              <span className="badge bg-bg-app-light text-ink-light font-extrabold text-[11px] px-2 py-0.5 rounded-pill flex items-center gap-1">
                <Icon name="clock" size={12} /> 25 min
              </span>
            </div>

            {/* Titre et sous-titre */}
            <div>
              <h1 className="font-black text-2xl md:text-3xl text-ink tracking-tight leading-tight">
                {p.name}
              </h1>
              <p className="text-[14px] text-ink-muted mt-1 font-medium">{p.sub}</p>
            </div>

            {/* Statistiques (note, ventes, boutique) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink-muted font-semibold mt-1">
              <Stars value={p.rating} size={14} />
              <span>· {p.sold_count} vendus</span>
              <span className="flex items-center gap-1 text-ink-light">
                <Icon name="bag" size={14} />
                {p.shop_name}
              </span>
            </div>

            <div className="h-[1px] bg-border-warm-light my-2" />

            {/* Variantes (Taille / Format / Quantité) */}
            <div>
              <h3 className="font-extrabold text-[14.5px] text-ink mb-2">Choisir une option</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {variants.map((o) => {
                  const selected = vSel === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setVSel(o.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-md border text-center transition-all cursor-pointer ${
                        selected 
                          ? 'bg-brand-tint border-brand shadow-sm' 
                          : 'bg-surface border-border-warm hover:bg-bg-app-light'
                      }`}
                    >
                      <div className={`font-black text-[13.5px] ${selected ? 'text-brand' : 'text-ink'}`}>
                        {o.name}
                      </div>
                      <div className="text-[11.5px] text-ink-placeholder font-semibold mt-1">
                        {o.price_delta ? `+ ${formatPrice(o.price_delta)}` : 'Inclus'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-extrabold text-[14.5px] text-ink mb-1.5">Description</h3>
              <p className="text-[13.5px] text-ink-light leading-relaxed">
                Ce produit <strong>{p.name}</strong> de qualité supérieure est préparé et fourni directement par notre partenaire <strong>{p.shop_name}</strong>. RUSH garantit une fraîcheur optimale et une livraison ultra-rapide à votre domicile pour assurer la meilleure expérience client.
              </p>
            </div>

            {/* Sélecteur de Quantité */}
            <div className="card bg-surface border border-border-warm flex items-center justify-between p-3.5 mt-2 rounded-md">
              <div>
                <div className="font-extrabold text-[14px] text-ink">Quantité</div>
                <div className="text-[12px] text-ink-placeholder font-semibold mt-0.5">
                  {formatPrice(unitPrice)} l'unité
                </div>
              </div>
              <div className="flex items-center bg-surface border border-border-warm rounded-pill">
                <button 
                  onClick={() => setQty(Math.max(1, qty - 1))} 
                  disabled={qty === 1}
                  className="w-8.5 h-8.5 flex items-center justify-center text-ink disabled:text-ink-placeholder cursor-pointer"
                >
                  <Icon name="minus" size={18} stroke={2.4} />
                </button>
                <span className="min-w-[24px] text-center font-black text-[15px]">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="w-8.5 h-8.5 flex items-center justify-center text-ink cursor-pointer"
                >
                  <Icon name="plus" size={18} stroke={2.4} />
                </button>
              </div>
            </div>

            {/* Badges de réassurance */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { ic: 'shield', t: 'Qualité vérifiée' },
                { ic: 'truck', t: 'Livraison 25 min' },
                { ic: 'percent', t: 'Meilleur prix' }
              ].map((x) => (
                <div key={x.t} className="card p-2 bg-surface rounded-md border border-border-warm text-center flex flex-col items-center">
                  <span className="text-success"><Icon name={x.ic} size={20} /></span>
                  <div className="text-[10.5px] font-bold text-ink-light mt-1.5 leading-tight">{x.t}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section d'ajout panier desktop (s'affiche uniquement sur écran large) */}
          <div className="hidden md:flex items-center gap-6 mt-6 pt-4 border-t border-border-warm-light">
            <div className="leading-tight">
              <div className="text-[11.5px] text-ink-placeholder font-bold">Total</div>
              <div className="price font-black text-2xl text-ink">{formatPrice(totalPrice)}</div>
            </div>
            <button 
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 btn btn-primary h-13 bg-brand hover:bg-brand-hover text-white font-extrabold px-6 rounded-pill shadow-brand cursor-pointer active:scale-98 transition-transform"
            >
              <Icon name="cart" size={20} stroke={2.1} />
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>

      {/* Carrousel des produits similaires */}
      <div className="flex flex-col gap-3 mt-6">
        <h3 className="font-black text-lg text-ink tracking-tight px-4 md:px-0">Produits similaires</h3>
        <div className="hide-scroll flex gap-3 overflow-x-auto px-4 md:px-0 pb-3">
          {similarProducts.map((s) => (
            <ProductMini 
              key={s.id} 
              p={s} 
              onOpen={(product) => router.push(productPath(product.id))}
              onAdd={(product) => addToCart(product, 1)}
            />
          ))}
        </div>
      </div>

      {/* Barre d'action collante en bas (mobile uniquement, masquée sur desktop) */}
      <div className="md:hidden fixed left-0 right-0 bottom-0 bg-surface/94 backdrop-blur-md border-t border-border-warm p-4.5 pb-safe flex items-center gap-4.5 z-30 shadow-warm-2">
        <div className="leading-none">
          <div className="text-[11.5px] text-ink-placeholder font-bold">Total</div>
          <div className="price font-extrabold text-[21px] text-ink mt-1">{formatPrice(totalPrice)}</div>
        </div>
        <button 
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-2 btn btn-primary h-12 bg-brand text-white font-extrabold px-5 rounded-pill shadow-brand cursor-pointer active:scale-95 transition-transform"
        >
          <Icon name="cart" size={20} stroke={2.1} />
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
