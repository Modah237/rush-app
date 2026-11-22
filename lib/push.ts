export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getPushStatus(): PushPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestPushPermission(): Promise<PushPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey && reg.pushManager) {
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          });
        }
      }
    } catch {
      // VAPID non configuré en local -> Notification API locale prête
    }
  }
  return permission;
}

export async function sendRushPushNotification(
  title: string,
  body: string,
  url = '/orders'
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/rush/brand/mark-red.png',
        badge: '/rush/brand/mark-red.png',
        data: { url },
      });
      return true;
    }
  } catch {
    // fallback Notification directe
  }

  new Notification(title, {
    body,
    icon: '/rush/brand/mark-red.png',
  });
  return true;
}
