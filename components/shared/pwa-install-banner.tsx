'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Icon from './icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallBanner: React.FC = () => {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const hideInstallOnRoute =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/merchant') ||
    pathname.startsWith('/rider');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const updateOnline = () => setIsOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    const wasDismissed = localStorage.getItem('rush_pwa_dismissed') === '1';
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      if (!wasDismissed) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setDismissed(false);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('rush_pwa_dismissed', '1');
  };

  return (
    <>
      {isOffline && (
        <div className="bg-ink text-white text-center text-[12px] font-bold py-1.5 px-4 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          Mode hors-ligne actif · Vos favoris et votre panier restent disponibles.
        </div>
      )}

      {!dismissed && deferredPrompt && !hideInstallOnRoute && (
        <div className="fixed bottom-24 md:bottom-6 left-4 z-40 max-w-[330px] bg-surface border border-border-warm rounded-[18px] p-3.5 shadow-warm-3 flex items-center gap-3 animate-scaleUp">
          <span className="w-10 h-10 rounded-[12px] bg-brand text-white flex items-center justify-center font-black text-base flex-none shadow-brand">
            R.
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-black text-[13px] text-ink leading-tight">Installer RUSH App</div>
            <div className="text-[11px] font-semibold text-ink-muted mt-0.5">Accès instantané · Mode hors-ligne</div>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="h-8 px-3 rounded-pill bg-brand text-white font-black text-[11.5px] cursor-pointer hover:bg-brand-hover"
          >
            Installer
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-ink-placeholder hover:text-ink p-1 cursor-pointer"
            aria-label="Fermer"
          >
            <Icon name="x" size={15} />
          </button>
        </div>
      )}
    </>
  );
};

export default PwaInstallBanner;
