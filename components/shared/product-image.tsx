import React from 'react';
import { Icon } from './icon';

interface ProductImageProps {
  glyph: string;
  tint?: string;
  ink?: string;
  radius?: string;
  size?: string | number;
  big?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  glyph,
  tint = '#FFE9EB',
  ink = 'var(--red)',
  radius = 'var(--radius-md)',
  size = '100%',
  big = false,
}) => {
  return (
    <div
      className="flex items-center justify-center relative overflow-hidden"
      style={{
        width: size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: radius,
        background: `radial-gradient(120% 120% at 25% 18%, #fff 0%, ${tint} 70%)`,
      }}
    >
      <div
        className="absolute w-[58%] h-[58%] rounded-full right-[-14px] bottom-[-14px]"
        style={{ background: ink, opacity: 0.07 }}
      />
      <span className="relative" style={{ color: ink }}>
        <Icon name={glyph} size={big ? 78 : 42} stroke={1.5} />
      </span>
    </div>
  );
};
export default ProductImage;
