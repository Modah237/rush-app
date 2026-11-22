import { createClient } from '@/lib/supabase/client';

export interface RiderTelemetryPoint {
  orderId: string;
  riderName: string;
  lat: number;
  lng: number;
  speedKmh: number;
  heading?: number;
  updatedAt: string;
  source: 'gps' | 'simulated';
}

const CHANNEL_NAME = 'rush-rider-telemetry';

function storageKey(orderId: string) {
  return `rush_telemetry_${orderId}`;
}

export function getLatestRiderTelemetry(orderId: string): RiderTelemetryPoint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(orderId));
    return raw ? (JSON.parse(raw) as RiderTelemetryPoint) : null;
  } catch {
    return null;
  }
}

/**
 * Diffuse la position GPS temps réel d'un Rusher via :
 * 1) localStorage + BroadcastChannel (synchro multi-onglets instantanée)
 * 2) Supabase Realtime Broadcast (synchro multi-appareils en production)
 */
export async function publishRiderTelemetry(point: RiderTelemetryPoint): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(storageKey(point.orderId), JSON.stringify(point));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(CHANNEL_NAME);
        bc.postMessage(point);
        bc.close();
      }
    } catch {
      // ignore storage/channel errors
    }
  }

  try {
    const supabase = createClient();
    const channel = supabase.channel(`${CHANNEL_NAME}-${point.orderId}`);
    await channel.send({
      type: 'broadcast',
      event: 'location',
      payload: point,
    });
    supabase.removeChannel(channel);
  } catch {
    // Supabase Realtime hors ligne -> BroadcastChannel/localStorage actif
  }
}

/**
 * S'abonne aux mises à jour GPS temps réel d'un livreur pour une commande donnée.
 */
export function subscribeRiderTelemetry(
  orderId: string,
  onPoint: (point: RiderTelemetryPoint) => void
): () => void {
  const cleanups: (() => void)[] = [];

  const initial = getLatestRiderTelemetry(orderId);
  if (initial) {
    onPoint(initial);
  }

  if (typeof window !== 'undefined') {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = (event: MessageEvent<RiderTelemetryPoint>) => {
        if (event.data && event.data.orderId === orderId) {
          onPoint(event.data);
        }
      };
      cleanups.push(() => bc.close());
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey(orderId) && e.newValue) {
        try {
          onPoint(JSON.parse(e.newValue) as RiderTelemetryPoint);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    cleanups.push(() => window.removeEventListener('storage', onStorage));
  }

  try {
    const supabase = createClient();
    const channel = supabase
      .channel(`${CHANNEL_NAME}-${orderId}`)
      .on(
        'broadcast',
        { event: 'location' },
        (msg: { event: string; type: 'broadcast'; payload?: RiderTelemetryPoint }) => {
          if (msg.payload && msg.payload.orderId === orderId) {
            onPoint(msg.payload);
          }
        }
      )
      .subscribe();
    cleanups.push(() => {
      supabase.removeChannel(channel);
    });
  } catch {
    // ignore when Supabase is not configured
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
