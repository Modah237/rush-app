import React from 'react';
import Icon from './icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  text: string;
  cta?: string;
  onCta?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  text,
  cta,
  onCta,
}) => {
  return (
    <div className="fade-in flex flex-col items-center text-center py-16 px-8 max-w-sm mx-auto">
      <span className="w-20 h-20 rounded-full flex items-center justify-center bg-bg-app-light text-ink-placeholder">
        <Icon name={icon} size={38} stroke={1.6} />
      </span>
      <h3 className="font-extrabold text-[18px] text-ink mt-[18px] tracking-tight">{title}</h3>
      <p className="text-[13.5px] text-ink-muted mt-1.5 leading-relaxed">{text}</p>
      {cta && onCta && (
        <button
          onClick={onCta}
          className="btn btn-dark h-11 bg-ink text-white font-bold px-5 rounded-pill mt-5 cursor-pointer hover:bg-ink-light active:scale-95 transition-transform"
        >
          {cta}
        </button>
      )}
    </div>
  );
};
export default EmptyState;
