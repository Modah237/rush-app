'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { getCategoryTheme } from './category-theme';
import SafeImage from './safe-image';
import Stars from './stars';
import Icon from './icon';
import { formatPrice } from '@/lib/utils';

interface ProductCardProps {
  p: Product;
  categorySlug?: string;
  onOpen: (p: Product) => void;
  onAdd: (p: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  p,
  categorySlug,
  onOpen,
  onAdd,
}) => {
  const slug = categorySlug || p.category_slug;
  const theme = getCategoryTheme(slug);
  const [bump, setBump] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBump(true);
    setTimeout(() => setBump(false), 160);
    onAdd(p, e);
  };

  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;

  return (
    <div
      onClick={() => onOpen(p)}
      className="card rise group flex flex-col overflow-hidden bg-surface rounded-md border border-border-warm-light/60 shadow-warm-1 cursor-pointer transition-all duration-200 hover:shadow-warm-2 hover:border-brand/10 active:scale-[0.98]"
    >
      <div className="p-2 relative">
        <SafeImage 
          src={p.image_url} 
          alt={p.name} 
          fallbackIcon={p.glyph} 
          fallbackTint={theme.tint} 
          fallbackInk={theme.ink} 
          radius="10px" 
        />
        <div className="absolute top-[14px] left-[14px] flex gap-[5px] z-20">
          {discount > 0 && (
            <span className="badge badge-promo bg-brand text-white font-extrabold text-[10px] px-2 py-0.5 rounded-pill shadow-sm">
              -{discount}%
            </span>
          )}
          {discount === 0 && p.tag && (
            <span className="badge bg-brand-tint text-brand font-extrabold text-[10px] px-2 py-0.5 rounded-pill shadow-sm">
              {p.tag}
            </span>
          )}
        </div>
      </div>
      
      <div className="px-3 pb-3 pt-1.5 flex flex-col flex-1">
        <div className="font-bold text-[14.5px] text-ink leading-tight tracking-tight group-hover:text-brand transition-colors line-clamp-1">
          {p.name}
        </div>
        <div className="text-[12.5px] text-ink-light font-medium mt-1">
          {p.sub}
        </div>
        
        <div className="flex items-center gap-1.5 mt-2">
          <Stars value={p.rating} size={11} />
          <span className="text-[11.5px] text-ink-muted font-bold">
            · {p.sold_count} vendus
          </span>
        </div>
        
        <div className="flex-1 min-h-[8px]" />
        
        <div className="flex items-center justify-between mt-2">
          <div className="leading-none">
            <div className={`price font-extrabold text-[15.5px] ${p.old_price ? 'text-brand' : 'text-ink'}`}>
              {formatPrice(p.price)}
            </div>
            {p.old_price && (
              <div className="text-[11.5px] text-ink-muted line-through font-semibold mt-1">
                {formatPrice(p.old_price)}
              </div>
            )}
          </div>
          
          <button
            onClick={handleAddClick}
            style={{ transform: bump ? 'scale(0.84)' : 'none' }}
            className="flex items-center justify-center btn btn-primary w-9 h-9 bg-brand text-white rounded-[10px] shadow-brand hover:bg-brand-hover active:bg-brand-active transition-transform duration-100 cursor-pointer"
          >
            <Icon name="plus" size={18} stroke={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
