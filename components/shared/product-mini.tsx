'use client';

import React from 'react';
import { Product } from '@/types';
import { getCategoryTheme } from './category-theme';
import SafeImage from './safe-image';
import Icon from './icon';
import { formatPrice } from '@/lib/utils';

interface ProductMiniProps {
  p: Product;
  categorySlug?: string;
  onOpen: (p: Product) => void;
  onAdd: (p: Product, e: React.MouseEvent) => void;
}

export const ProductMini: React.FC<ProductMiniProps> = ({
  p,
  categorySlug,
  onOpen,
  onAdd,
}) => {
  const slug = categorySlug || p.category_slug;
  const theme = getCategoryTheme(slug);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(p, e);
  };

  const discount = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;

  return (
    <div
      onClick={() => onOpen(p)}
      className="card flex-none overflow-hidden bg-surface rounded-md border border-border-warm-light/60 shadow-warm-1 cursor-pointer transition-all hover:shadow-warm-2 hover:border-brand/10 active:scale-[0.98] w-[154px]"
    >
      <div className="p-1.5 relative">
        <SafeImage 
          src={p.image_url} 
          alt={p.name} 
          fallbackIcon={p.glyph} 
          fallbackTint={theme.tint} 
          fallbackInk={theme.ink} 
          radius="9px" 
        />
        {discount > 0 && (
          <span className="badge badge-promo bg-brand text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-pill absolute top-[10px] left-[10px] z-10 shadow-sm">
            -{discount}%
          </span>
        )}
      </div>
      <div className="px-3 pb-3">
        <div className="font-bold text-[13.5px] text-ink leading-tight h-[33px] overflow-hidden line-clamp-2">
          {p.name}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className={`price font-extrabold text-[14.5px] ${p.old_price ? 'text-brand' : 'text-ink'}`}>
            {formatPrice(p.price)}
          </span>
          <button
            onClick={handleAddClick}
            className="flex items-center justify-center btn btn-primary w-8.5 h-8.5 bg-brand text-white rounded-[9px] cursor-pointer hover:bg-brand-hover active:scale-[0.92] transition-transform"
          >
            <Icon name="plus" size={16} stroke={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProductMini;
