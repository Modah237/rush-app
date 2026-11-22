'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AnalyticsEventName,
  Order,
  OrderReview,
  OrderStatus,
  Product,
  RushAnalyticsEvent,
  RushNotification,
  SavedAddress,
} from '@/types';
import { MOCK_ORDERS } from '@/lib/mock-data';
import Icon from '@/components/shared/icon';

export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'warning' | 'error';
  actionLabel?: string;
  actionHref?: string;
}

export interface UserProfileState {
  name: string;
  phone: string;
  city: string;
  preferredPayment: 'mtn' | 'orange' | 'cash';
  loyaltyPoints: number;
}

const DEFAULT_PROFILE: UserProfileState = {
  name: 'Aïssatou M.',
  phone: '678451290',
  city: 'Douala',
  preferredPayment: 'mtn',
  loyaltyPoints: 2500,
};

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-akwa',
    label: 'Domicile · Akwa',
    cityId: 'douala',
    zoneId: 'dla-akwa',
    address: 'Akwa, Rue Joss (face Immeuble Shell)',
    lat: 4.0536,
    lng: 9.6989,
    isDefault: true,
  },
  {
    id: 'addr-bonapriso',
    label: 'Bureau · Bonapriso',
    cityId: 'douala',
    zoneId: 'dla-bonapriso',
    address: 'Bonapriso, Rue des Palmiers',
    lat: 4.0273,
    lng: 9.7014,
    isDefault: false,
  },
];

const DEFAULT_NOTIFICATIONS: RushNotification[] = [
  {
    id: 'notif-1',
    title: 'Livraison en route · RSH-20492',
    message: 'Eric N. approche d’Akwa avec votre commande Mahima Supermarché.',
    kind: 'order',
    href: '/orders/RSH-20492',
    read: false,
    createdAt: '2026-05-31T14:35:00Z',
  },
  {
    id: 'notif-2',
    title: 'Code RUSH25 actif (-25%)',
    message: 'Profitez de 25% de réduction sur votre prochaine commande.',
    kind: 'promo',
    href: '/promos',
    read: false,
    createdAt: '2026-05-31T09:00:00Z',
  },
];

interface RushStoreContextType {
  isHydrated: boolean;
  // Favorites
  favoriteProductIds: string[];
  favoriteShopIds: string[];
  toggleFavoriteProduct: (productId: string, productName?: string) => void;
  toggleFavoriteShop: (shopId: string, shopName?: string) => void;
  isFavoriteProduct: (productId: string) => boolean;
  isFavoriteShop: (shopId: string) => boolean;
  // Addresses
  addresses: SavedAddress[];
  addAddress: (addr: Omit<SavedAddress, 'id'>) => SavedAddress;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  // Local Orders & Live Overrides
  localOrders: Order[];
  orderStatusOverrides: Record<string, OrderStatus>;
  addLocalOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  getMergedOrders: (baseOrders?: Order[]) => Order[];
  getOrderByReference: (reference: string) => Order | undefined;
  // Notifications
  notifications: RushNotification[];
  unreadCount: number;
  addNotification: (n: Omit<RushNotification, 'id' | 'read' | 'createdAt'>) => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  // Profile
  userProfile: UserProfileState;
  updateUserProfile: (patch: Partial<UserProfileState>) => void;
  // Analytics
  analyticsEvents: RushAnalyticsEvent[];
  trackEvent: (event: AnalyticsEventName, label: string, value?: number, meta?: Record<string, string | number>) => void;
  // Custom merchant products
  customProducts: Product[];
  addCustomProduct: (product: Product) => void;
  // Post-delivery reviews
  orderReviews: Record<string, OrderReview>;
  submitOrderReview: (review: Omit<OrderReview, 'createdAt'>) => void;
  getOrderReview: (orderId: string) => OrderReview | undefined;
  // Toasts
  pushToast: (message: string, tone?: ToastItem['tone'], action?: { label: string; href: string }) => void;
}

const RushStoreContext = createContext<RushStoreContextType | undefined>(undefined);

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const RushStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>(['p1', 'p3']);
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>(['s1']);
  const [addresses, setAddresses] = useState<SavedAddress[]>(DEFAULT_ADDRESSES);
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [orderStatusOverrides, setOrderStatusOverrides] = useState<Record<string, OrderStatus>>({});
  const [notifications, setNotifications] = useState<RushNotification[]>(DEFAULT_NOTIFICATIONS);
  const [userProfile, setUserProfile] = useState<UserProfileState>(DEFAULT_PROFILE);
  const [analyticsEvents, setAnalyticsEvents] = useState<RushAnalyticsEvent[]>([]);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [orderReviews, setOrderReviews] = useState<Record<string, OrderReview>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setFavoriteProductIds(safeReadJson('rush_fav_products', ['p1', 'p3']));
    setFavoriteShopIds(safeReadJson('rush_fav_shops', ['s1']));
    setAddresses(safeReadJson('rush_addresses', DEFAULT_ADDRESSES));
    setLocalOrders(safeReadJson('rush_local_orders', []));
    setOrderStatusOverrides(safeReadJson('rush_order_overrides', {}));
    setNotifications(safeReadJson('rush_notifications', DEFAULT_NOTIFICATIONS));
    setUserProfile(safeReadJson('rush_user_profile', DEFAULT_PROFILE));
    setAnalyticsEvents(safeReadJson('rush_analytics', []));
    setCustomProducts(safeReadJson('rush_custom_products', []));
    setOrderReviews(safeReadJson('rush_order_reviews', {}));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_fav_products', JSON.stringify(favoriteProductIds));
  }, [favoriteProductIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_fav_shops', JSON.stringify(favoriteShopIds));
  }, [favoriteShopIds, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_addresses', JSON.stringify(addresses));
  }, [addresses, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_local_orders', JSON.stringify(localOrders));
  }, [localOrders, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_order_overrides', JSON.stringify(orderStatusOverrides));
  }, [orderStatusOverrides, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_notifications', JSON.stringify(notifications));
  }, [notifications, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_user_profile', JSON.stringify(userProfile));
  }, [userProfile, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_analytics', JSON.stringify(analyticsEvents.slice(0, 200)));
  }, [analyticsEvents, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_custom_products', JSON.stringify(customProducts));
  }, [customProducts, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem('rush_order_reviews', JSON.stringify(orderReviews));
  }, [orderReviews, isHydrated]);

  const pushToast = useCallback(
    (message: string, tone: ToastItem['tone'] = 'success', action?: { label: string; href: string }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone, actionLabel: action?.label, actionHref: action?.href }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    []
  );

  const toggleFavoriteProduct = useCallback(
    (productId: string, productName?: string) => {
      setFavoriteProductIds((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
        pushToast(
          exists
            ? `${productName || 'Produit'} retiré des favoris`
            : `${productName || 'Produit'} ajouté aux favoris`,
          exists ? 'info' : 'success'
        );
        return next;
      });
    },
    [pushToast]
  );

  const toggleFavoriteShop = useCallback(
    (shopId: string, shopName?: string) => {
      setFavoriteShopIds((prev) => {
        const exists = prev.includes(shopId);
        const next = exists ? prev.filter((id) => id !== shopId) : [shopId, ...prev];
        pushToast(
          exists
            ? `${shopName || 'Boutique'} retirée des favoris`
            : `${shopName || 'Boutique'} ajoutée aux favoris`,
          exists ? 'info' : 'success'
        );
        return next;
      });
    },
    [pushToast]
  );

  const isFavoriteProduct = useCallback(
    (productId: string) => favoriteProductIds.includes(productId),
    [favoriteProductIds]
  );

  const isFavoriteShop = useCallback(
    (shopId: string) => favoriteShopIds.includes(shopId),
    [favoriteShopIds]
  );

  const addAddress = useCallback((addr: Omit<SavedAddress, 'id'>) => {
    const newAddr: SavedAddress = { ...addr, id: `addr-${Date.now()}` };
    setAddresses((prev) => {
      const base = addr.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return [newAddr, ...base];
    });
    return newAddr;
  }, []);

  const removeAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const addNotification = useCallback((n: Omit<RushNotification, 'id' | 'read' | 'createdAt'>) => {
    const entry: RushNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [entry, ...prev].slice(0, 30));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const addLocalOrder = useCallback(
    (order: Order) => {
      setLocalOrders((prev) => {
        const next = [order, ...prev.filter((o) => o.id !== order.id)];
        try {
          localStorage.setItem('rush_local_orders', JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
        return next;
      });
      setUserProfile((prev) => ({
        ...prev,
        loyaltyPoints: prev.loyaltyPoints + Math.max(50, Math.round(order.total_amount / 50)),
      }));
      addNotification({
        title: `Commande ${order.id} enregistrée`,
        message: `Montant ${order.total_amount.toLocaleString('fr-FR')} FCFA · ${order.delivery_address}`,
        kind: 'order',
        href: `/orders/${order.id}`,
      });
    },
    [addNotification]
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, note?: string) => {
      setOrderStatusOverrides((prev) => ({ ...prev, [orderId]: status }));
      setLocalOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const nextTimeline = [
            ...(o.timeline || []),
            {
              status,
              label: status,
              note: note || `Statut mis à jour : ${status}`,
              at: new Date().toISOString(),
            },
          ];
          return {
            ...o,
            status,
            updated_at: new Date().toISOString(),
            eta_minutes: status === 'delivered' ? 0 : status === 'out_for_delivery' ? 12 : o.eta_minutes,
            timeline: nextTimeline,
          };
        })
      );
    },
    []
  );

  const getMergedOrders = useCallback(
    (baseOrders: Order[] = MOCK_ORDERS) => {
      const seen = new Set<string>();
      const combined: Order[] = [];
      for (const o of [...localOrders, ...baseOrders]) {
        if (seen.has(o.id)) continue;
        seen.add(o.id);
        const overrideStatus = orderStatusOverrides[o.id];
        combined.push(overrideStatus ? { ...o, status: overrideStatus } : o);
      }
      return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    [localOrders, orderStatusOverrides]
  );

  const getOrderByReference = useCallback(
    (reference: string) => getMergedOrders().find((o) => o.id === reference),
    [getMergedOrders]
  );

  const updateUserProfile = useCallback((patch: Partial<UserProfileState>) => {
    setUserProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const trackEvent = useCallback(
    (event: AnalyticsEventName, label: string, value?: number, meta?: Record<string, string | number>) => {
      const entry: RushAnalyticsEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        event,
        label,
        value,
        meta,
        at: new Date().toISOString(),
      };
      setAnalyticsEvents((prev) => [entry, ...prev].slice(0, 200));
    },
    []
  );

  const addCustomProduct = useCallback((product: Product) => {
    setCustomProducts((prev) => [product, ...prev]);
  }, []);

  const submitOrderReview = useCallback(
    (review: Omit<OrderReview, 'createdAt'>) => {
      const entry: OrderReview = {
        ...review,
        createdAt: new Date().toISOString(),
      };
      setOrderReviews((prev) => ({ ...prev, [review.orderId]: entry }));
      setUserProfile((prev) => ({ ...prev, loyaltyPoints: prev.loyaltyPoints + 100 }));
    },
    []
  );

  const getOrderReview = useCallback(
    (orderId: string) => orderReviews[orderId],
    [orderReviews]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RushStoreContext.Provider
      value={{
        isHydrated,
        favoriteProductIds,
        favoriteShopIds,
        toggleFavoriteProduct,
        toggleFavoriteShop,
        isFavoriteProduct,
        isFavoriteShop,
        addresses,
        addAddress,
        removeAddress,
        setDefaultAddress,
        localOrders,
        orderStatusOverrides,
        addLocalOrder,
        updateOrderStatus,
        getMergedOrders,
        getOrderByReference,
        notifications,
        unreadCount,
        addNotification,
        markAllNotificationsRead,
        markNotificationRead,
        userProfile,
        updateUserProfile,
        analyticsEvents,
        trackEvent,
        customProducts,
        addCustomProduct,
        orderReviews,
        submitOrderReview,
        getOrderReview,
        pushToast,
      }}
    >
      {children}

      {/* Global Toast Viewport */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-[340px] w-[calc(100%-2rem)] pointer-events-none"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto animate-scaleUp bg-ink text-white rounded-[16px] px-4 py-3 shadow-warm-3 border border-white/10 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-none ${
                    toast.tone === 'error'
                      ? 'bg-brand text-white'
                      : toast.tone === 'warning'
                        ? 'bg-warning text-white'
                        : toast.tone === 'info'
                          ? 'bg-info text-white'
                          : 'bg-success text-white'
                  }`}
                >
                  <Icon name={toast.tone === 'error' ? 'x' : toast.tone === 'info' ? 'spark' : 'check'} size={13} stroke={3} />
                </span>
                <span className="text-[12.5px] font-bold leading-snug truncate">{toast.message}</span>
              </div>
              {toast.actionLabel && toast.actionHref && (
                <a
                  href={toast.actionHref}
                  className="text-[11.5px] font-black text-brand hover:underline flex-none"
                >
                  {toast.actionLabel}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </RushStoreContext.Provider>
  );
};

export const useRushStore = () => {
  const ctx = useContext(RushStoreContext);
  if (!ctx) {
    throw new Error('useRushStore doit être utilisé au sein d\'un RushStoreProvider');
  }
  return ctx;
};

export const useOptionalRushStore = () => useContext(RushStoreContext);
