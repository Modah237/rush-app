import React from 'react';
import { Icon } from './icon';

interface StarsProps {
  value: number;
  size?: number;
  showNum?: boolean;
  muted?: boolean;
}

export const Stars: React.FC<StarsProps> = ({ value, size = 12, showNum = true, muted = false }) => {
  return (
    <span 
      className="flex items-center gap-1" 
      style={{ color: muted ? 'var(--ink-3)' : 'var(--amber)' }}
    >
      <Icon name="star" size={size} stroke={0} style={{ fill: 'currentColor' }} />
      <span className="font-extrabold text-[12.5px] text-ink">{value}</span>
    </span>
  );
};
export default Stars;
