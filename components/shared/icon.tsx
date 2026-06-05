import React from 'react';

export const ICON_PATHS: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/>',
  pin: '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  cart: '<path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c1-3.6 4-5.4 7-5.4s6 1.8 7 5.4"/>',
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h12v-9.5"/><path d="M10 20v-5h4v5"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
  bag: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  bell: '<path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  heart: '<path d="M12 20s-7-4.3-9.3-9C1.2 8 3 4.5 6.4 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.4 0 5.2 3.5 3.7 6.5C19 15.7 12 20 12 20Z"/>',
  star: '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  arrowR: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 6.5"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  sliders: '<path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2.2"/><circle cx="8" cy="16" r="2.2"/>',
  percent: '<circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/><path d="M6 18 18 6"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9V4Z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
  shield: '<path d="M12 3 5 6v6c0 4.4 3 7.4 7 9 4-1.6 7-4.6 7-9V6l-7-3Z"/><path d="M9 12l2 2 4-4"/>',
  headset: '<path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="3.5" y="12.5" width="3.5" height="6" rx="1.4"/><rect x="17" y="12.5" width="3.5" height="6" rx="1.4"/><path d="M19 18.5c0 2-2 3-4 3"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.4"/><path d="M3 10h18"/><circle cx="16.5" cy="14" r="1.3"/>',
  phone: '<path d="M6 3h5l1.5 4.5-2.2 1.4a12 12 0 0 0 4.8 4.8l1.4-2.2L21 13v5a2 2 0 0 1-2 2C11 19.5 4.5 13 4 5a2 2 0 0 1 2-2Z"/>',
  trash: '<path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13"/>',
  pkg: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  flame: '<path d="M12 3c1 3-2 4-2 7a2.5 2.5 0 0 0 5 0c0-1-.5-2-.5-2 2 1 3.5 3 3.5 6a6 6 0 1 1-12 0c0-4 4-5 6-11Z"/>',
  
  // Category & Product glyphs
  basket: '<path d="M5 9h14l-1.2 9.5a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 9Z"/><path d="M8.5 9 11 3.5M15.5 9 13 3.5M9 12.5v4M15 12.5v4M12 12.5v4"/>',
  leaf: '<path d="M5 19c0-8 6-13 14-13 0 8-6 13-14 13Z"/><path d="M5 19c3-5 7-8 11-9.5"/>',
  bottle: '<path d="M10 3h4v2.5l1.2 2.4a4 4 0 0 1 .4 1.8V19a2 2 0 0 1-2 2h-3.2a2 2 0 0 1-2-2V9.7a4 4 0 0 1 .4-1.8L10 5.5V3Z"/><path d="M9 13h6"/>',
  bowl: '<path d="M3.5 11h17a8.5 8.5 0 0 1-8.5 8 8.5 8.5 0 0 1-8.5-8Z"/><path d="M8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3"/>',
  spray: '<path d="M9 8h6v12a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20V8Z"/><path d="M9 11h6M11 8V5h3V3M17 5h.01M19 7h.01M17 9h.01"/>',
  device: '<rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M11 18h2"/>',
  plantain: '<path d="M5 16c5 4 11 2 14-3 0 0-1 .5-2.5 0C18 9 17 5 17 5s-1 3-3.5 5C9 13 7 13 5 16Z"/>',
  tomato: '<circle cx="12" cy="13.5" r="7"/><path d="M9 6.5c1-1 2-1 3-.5 1-.5 2-.5 3 .5M12 6.5V9"/>',
  rice: '<path d="M6 9h12l-1 10.5a1.5 1.5 0 0 1-1.5 1.3H8.5A1.5 1.5 0 0 1 7 19.5L6 9Z"/><path d="M8 9 9.5 4h5L16 9"/>',
  oil: '<path d="M9 8h6v11a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 19V8Z"/><path d="M10 8V5h4v3M14.5 5h2.5v3l-2 1"/>',
  water: '<path d="M12 3.5c3.5 4.5 5.5 7.3 5.5 10a5.5 5.5 0 1 1-11 0c0-2.7 2-5.5 5.5-10Z"/>',
  soda: '<path d="M8 3h8l-1 4H9L8 3Z"/><path d="M9 7h6l-.6 12.5a1.4 1.4 0 0 1-1.4 1.3h-2A1.4 1.4 0 0 1 9.6 19.5L9 7Z"/>',
  chicken: '<path d="M14 4a5 5 0 0 1 1 9.5c-1 .5-1.5 1.5-1.5 2.5l-.5 4h-2l-.5-4c0-1-.5-2-1.5-2.5A5 5 0 0 1 10 4"/>',
  egg: '<path d="M12 3c3.5 0 6 5 6 9a6 6 0 1 1-12 0c0-4 2.5-9 6-9Z"/>',
  bread: '<path d="M5 11a4 4 0 0 1 4-4h6a4 4 0 0 1 0 8H9a4 4 0 0 1-4-4Z" transform="translate(0 1)"/><path d="M9 9v6M12 9v6M15 9v6"/>',
  milk: '<path d="M9 8 8 6V3h8v3l-1 2v11a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 19V8Z"/><path d="M9 12h6"/>',
  coffee: '<path d="M5 8h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2M9 5c0-1 .5-1.5.5-2.5M12.5 5c0-1 .5-1.5.5-2.5"/>',
};

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  stroke = 1.9,
  className = '',
  style = {},
}) => {
  const path = ICON_PATHS[name] || '';
  
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
};

export default Icon;
