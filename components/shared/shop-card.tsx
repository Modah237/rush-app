'use client';

import React from 'react';
import { Shop } from '@/types';
import SafeImage from './safe-image';
import Icon from './icon';
import { formatPrice } from '@/lib/utils';

interface ShopCardProps {
  s: Shop;
  onOpen?: (s: Shop) => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ s, onOpen }) => {
  const handleCardClick = () => {
    if (onOpen) onOpen(s);
  };

  return (
    <div
      onClick={handleCardClick}
      className="card rise overflow-hidden bg-surface rounded-md border border-border-warm-light/60 shadow-warm-1 cursor-pointer transition-all duration-200 hover:shadow-warm-2 hover:border-brand/10 active:scale-[0.99] group"
    >
      {/* Photo de couverture de la boutique */}
      <div className="h-28 relative overflow-hidden">
        <SafeImage 
          src={s.cover_image_url} 
          alt={s.name} 
          fallbackIcon={s.glyph} 
          fallbackTint={s.tint}
          fallbackInk="var(--ink)"
          radius="0px"
          aspectRatio="video"
          className="group-hover:scale-105 transition-transform duration-500 h-full"
        />
        
        {/* Scrim dégradé sur le cover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />

        {/* Badges promo et livraison sur le cover */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5 items-start">
          {s.promo && (
            <span className="badge badge-promo bg-brand text-white font-extrabold text-[10px] px-2 py-0.5 rounded-pill flex items-center gap-1 shadow-sm">
              <Icon name="percent" size={10} stroke={2.4} />
              {s.promo}
            </span>
          )}
          {s.delivery_fee === 0 && (
            <span className="badge badge-free bg-success text-white font-extrabold text-[10px] px-2 py-0.5 rounded-pill shadow-sm">
              Livraison offerte
            </span>
          )}
        </div>

        {/* Bouton de favori */}
        <button 
          className="absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-surface shadow-warm-1 flex items-center justify-center text-ink hover:text-brand transition-all active:scale-90"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Icon name="heart" size={16} />
        </button>
      </div>

      {/* Zone d'infos de la boutique avec Logo incrusté */}
      <div className="p-3.5 pt-4.5 relative">
        {/* Logo de la boutique qui dépasse sur la couverture */}
        <div className="absolute w-12 h-12 rounded-full border-2 border-surface bg-surface overflow-hidden shadow-warm-2 top-[-24px] left-3.5 z-20">
          <img 
            src={s.logo_url || ''} 
            alt="" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="flex items-start justify-between">
          <div className="font-extrabold text-[15px] text-ink tracking-tight group-hover:text-brand transition-colors line-clamp-1">
            {s.name}
          </div>
          <span className="badge badge-ghost bg-bg-app-light text-ink-light font-extrabold text-[10.5px] px-2 py-0.5 rounded-pill flex items-center gap-1">
            <Icon name="star" size={10} stroke={0} style={{ fill: 'var(--amber)', color: 'var(--amber)' }} />
            {s.rating}
          </span>
        </div>
        
        <div className="text-[12px] text-ink-muted mt-0.5">
          {s.category} {s.distance ? `· ${s.distance}` : ''}
        </div>
        
        <div className="flex items-center gap-3.5 mt-2.5 text-[12px] text-ink-light font-semibold border-t border-border-warm-light/50 pt-2.5">
          <span className="flex items-center gap-1">
            <Icon name="clock" size={14} className="text-brand" />
            {s.eta_minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Icon name="truck" size={14} />
            {s.delivery_fee === 0 ? 'Gratuit' : formatPrice(s.delivery_fee)}
          </span>
        </div>
      </div>
    </div>
  );
};
export default ShopCard;
