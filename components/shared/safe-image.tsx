'use client';

import React, { useState, useEffect } from 'react';
import Icon from './icon';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  fallbackIcon?: string;
  fallbackTint?: string;
  fallbackInk?: string;
  className?: string;
  radius?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackIcon = 'basket',
  fallbackTint = '#FFE9EB',
  fallbackInk = 'var(--red)',
  className = '',
  radius = 'var(--radius-md)',
  aspectRatio = 'square',
}) => {
  const [error, setError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  const aspectClass = 
    aspectRatio === 'square' ? 'aspect-square' : 
    aspectRatio === 'video' ? 'aspect-video' : 'aspect-auto';

  // Render fallback immediately if src is empty or has error
  if (!src || error) {
    return (
      <div 
        className={cn(
          "w-full flex items-center justify-center relative overflow-hidden bg-bg-app-light",
          aspectClass,
          className
        )}
        style={{ 
          borderRadius: radius, 
          background: `radial-gradient(120% 120% at 25% 18%, #fff 0%, ${fallbackTint} 70%)` 
        }}
      >
        <div
          className="absolute w-[58%] h-[58%] rounded-full right-[-14px] bottom-[-14px]"
          style={{ background: fallbackInk, opacity: 0.07 }}
        />
        <span className="relative" style={{ color: fallbackInk }}>
          <Icon name={fallbackIcon} size={38} stroke={1.5} />
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden w-full flex items-center justify-center select-none bg-bg-app-light",
        aspectClass,
        className
      )}
      style={{ borderRadius: radius }}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
};

export default SafeImage;
