'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/shared/icon';
import { useRushStore } from '@/context/rush-store-context';
import { useCart } from '@/context/cart-context';
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { CAMEROON_CITIES, CAMEROON_ZONES } from '@/lib/cameroon-geo';
import { RUSH_PROMOS } from '@/lib/promos';
import { formatPrice } from '@/lib/utils';
import { productPath } from '@/lib/routes';
import { getLocalAuthSession, signOutUser } from '@/lib/auth';
import { getPushStatus, PushPermissionState, requestPushPermission, sendRushPushNotification } from '@/lib/push';
import { createClient } from '@/lib/supabase/client';

type AccountSection = 'menu' | 'addresses' | 'favorites' | 'notifications' | 'promos' | 'edit';

export default function AccountPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const {
    userProfile,
    updateUserProfile,
    addresses,
    addAddress,
    removeAddress,
    setDefaultAddress,
    favoriteProductIds,
    favoriteShopIds,
    toggleFavoriteProduct,
    toggleFavoriteShop,
    notifications,
    unreadCount,
    markAllNotificationsRead,
    getMergedOrders,
    customProducts,
    pushToast,
  } = useRushStore();

  const [section, setSection] = useState<AccountSection>('menu');
  const [authSessionLabel, setAuthSessionLabel] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushPermissionState>('default');

  useEffect(() => {
    setPushState(getPushStatus());
    const localAuth = getLocalAuthSession();
    if (localAuth) {
      setAuthSessionLabel(`OTP Cameroun (${localAuth.phone || localAuth.role || 'Actif'})`);
    }
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setAuthSessionLabel(`Supabase Auth (${data.user.phone || data.user.email || 'Connecté'})`);
        }
      });
    } catch {
      // ignore offline
    }
  }, []);

  // Edit profile form
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [phoneInput, setPhoneInput] = useState(userProfile.phone);
  const [cityInput, setCityInput] = useState(userProfile.city);
  const [payInput, setPayInput] = useState(userProfile.preferredPayment);

  // Add address form
  const [addrLabel, setAddrLabel] = useState('');
  const [addrCityId, setAddrCityId] = useState('douala');
  const [addrZoneId, setAddrZoneId] = useState('dla-akwa');
  const [addrStreet, setAddrStreet] = useState('');

  const allOrders = getMergedOrders();
  const allProducts = [...customProducts, ...MOCK_PRODUCTS];
  const favProducts = allProducts.filter((p) => favoriteProductIds.includes(p.id));
  const favShops = MOCK_SHOPS.filter((s) => favoriteShopIds.includes(s.id));
  const totalFavorites = favProducts.length + favShops.length;

  const avatarLetters = userProfile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'RU';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: nameInput.trim() || 'Client RUSH',
      phone: phoneInput.trim() || '678451290',
      city: cityInput,
      preferredPayment: payInput,
    });
    pushToast('Profil mis à jour', 'success');
    setSection('menu');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLabel.trim() || !addrStreet.trim()) return;
    const zone = CAMEROON_ZONES.find((z) => z.id === addrZoneId) || CAMEROON_ZONES[0];
    addAddress({
      label: addrLabel.trim(),
      cityId: addrCityId,
      zoneId: zone.id,
      address: `${zone.name}, ${addrStreet.trim()} (${zone.cityName})`,
      lat: zone.lat,
      lng: zone.lng,
      isDefault: addresses.length === 0,
    });
    setAddrLabel('');
    setAddrStreet('');
    pushToast('Adresse ajoutée', 'success');
  };

  const accountMenu = [
    {
      ic: 'pkg',
      label: 'Mes commandes',
      sub: `${allOrders.length} commandes actives et passées`,
      href: '/orders',
      action: null,
    },
    {
      ic: 'pin',
      label: 'Mes adresses',
      sub: `${addresses.length} adresses enregistrées (${addresses.find((a) => a.isDefault)?.label || userProfile.city})`,
      href: null,
      action: () => setSection('addresses'),
    },
    {
      ic: 'heart',
      label: 'Favoris',
      sub: `${favProducts.length} produits · ${favShops.length} boutiques`,
      href: null,
      action: () => setSection('favorites'),
    },
    {
      ic: 'percent',
      label: 'Codes promo & Fidélité',
      sub: `${RUSH_PROMOS.length} offres actives · ${userProfile.loyaltyPoints} pts`,
      href: null,
      action: () => setSection('promos'),
    },
    {
      ic: 'bell',
      label: 'Notifications',
      sub: unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes lues',
      href: null,
      action: () => setSection('notifications'),
    },
    {
      ic: 'wallet',
      label: 'Préférences & Profil',
      sub: `Paiement favori : ${userProfile.preferredPayment.toUpperCase()}`,
      href: null,
      action: () => {
        setNameInput(userProfile.name);
        setPhoneInput(userProfile.phone);
        setCityInput(userProfile.city);
        setPayInput(userProfile.preferredPayment);
        setSection('edit');
      },
    },
    {
      ic: 'headset',
      label: 'Aide & support',
      sub: 'FAQ, contact & assistance 7j/7',
      href: '/help',
      action: null,
    },
  ];

  const cityZones = CAMEROON_ZONES.filter((z) => z.cityId === addrCityId);

  return (
    <div className="page-enter flex flex-col gap-6 pb-20 md:pb-10">
      {/* Banner Profil rouge */}
      <div className="bg-gradient-to-br from-[#FF2233] to-brand-active text-white rounded-b-xl md:rounded-xl p-6 shadow-warm-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {section !== 'menu' && (
              <button
                type="button"
                onClick={() => setSection('menu')}
                className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white cursor-pointer hover:bg-white/25"
              >
                <Icon name="chevL" size={20} stroke={2.4} />
              </button>
            )}
            <h1 className="font-black text-xl tracking-tight">Mon compte</h1>
          </div>
          <button
            type="button"
            onClick={() => setSection('notifications')}
            className="relative w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
          >
            <Icon name="bell" size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-ink text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-2xl shadow-inner select-none">
              {avatarLetters}
            </span>
            <div>
              <h2 className="font-black text-lg tracking-tight leading-tight">{userProfile.name}</h2>
              <p className="text-[12.5px] text-white/85 font-semibold mt-1">
                +237 {userProfile.phone} · {userProfile.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setNameInput(userProfile.name);
              setPhoneInput(userProfile.phone);
              setCityInput(userProfile.city);
              setPayInput(userProfile.preferredPayment);
              setSection('edit');
            }}
            className="px-3.5 py-2 rounded-pill bg-white/15 hover:bg-white/25 text-[12px] font-black cursor-pointer"
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3.5 px-4 md:px-0">
        <Link href="/orders" className="card p-4 bg-surface rounded-lg shadow-warm-1 text-center flex flex-col items-center justify-center transition-transform active:scale-[0.97]">
          <span className="text-brand"><Icon name="pkg" size={22} /></span>
          <div className="font-black text-[16px] text-ink mt-1.5">{allOrders.length}</div>
          <div className="text-[10.5px] text-ink-placeholder font-black uppercase mt-0.5 tracking-wider">Commandes</div>
        </Link>

        <button
          type="button"
          onClick={() => setSection('favorites')}
          className="card p-4 bg-surface rounded-lg shadow-warm-1 text-center flex flex-col items-center justify-center transition-transform active:scale-[0.97] cursor-pointer"
        >
          <span className="text-brand"><Icon name="heart" size={22} /></span>
          <div className="font-black text-[16px] text-ink mt-1.5">{totalFavorites}</div>
          <div className="text-[10.5px] text-ink-placeholder font-black uppercase mt-0.5 tracking-wider">Favoris</div>
        </button>

        <button
          type="button"
          onClick={() => setSection('promos')}
          className="card p-4 bg-surface rounded-lg shadow-warm-1 text-center flex flex-col items-center justify-center transition-transform active:scale-[0.97] cursor-pointer"
        >
          <span className="text-brand"><Icon name="wallet" size={22} /></span>
          <div className="font-black text-[16px] text-ink mt-1.5">{userProfile.loyaltyPoints.toLocaleString('fr-FR')}</div>
          <div className="text-[10.5px] text-ink-placeholder font-black uppercase mt-0.5 tracking-wider">Points fidélité</div>
        </button>
      </div>

      {/* Vue Menu Principal */}
      {section === 'menu' && (
        <>
          {/* Statut Authentification OTP & Notifications Push */}
          <div className="mx-4 md:mx-0 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="card bg-surface p-4 rounded-lg border border-border-warm-light shadow-warm-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-wider text-ink-muted">
                  Session Authentification
                </div>
                <div className="text-[13px] font-extrabold text-ink truncate mt-0.5">
                  {authSessionLabel || 'Mode invité local (non connecté)'}
                </div>
              </div>
              {authSessionLabel ? (
                <button
                  type="button"
                  onClick={async () => {
                    await signOutUser();
                    setAuthSessionLabel(null);
                    pushToast('Déconnexion effectuée', 'info');
                  }}
                  className="h-9 px-3.5 rounded-pill border border-brand/30 text-brand text-[12px] font-black hover:bg-brand-tint cursor-pointer flex-none"
                >
                  Déconnexion
                </button>
              ) : (
                <div className="flex gap-1.5 flex-none">
                  <Link
                    href="/login"
                    className="h-9 px-3.5 rounded-pill bg-ink text-white text-[12px] font-black flex items-center hover:bg-ink-light"
                  >
                    Connexion OTP
                  </Link>
                  <Link
                    href="/register"
                    className="h-9 px-3 rounded-pill bg-brand-tint text-brand text-[12px] font-black flex items-center"
                  >
                    Créer
                  </Link>
                </div>
              )}
            </div>

            <div className="card bg-surface p-4 rounded-lg border border-border-warm-light shadow-warm-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-wider text-ink-muted">
                  Notifications Push Web
                </div>
                <div className="text-[13px] font-extrabold text-ink truncate mt-0.5">
                  {pushState === 'granted'
                    ? 'Activées sur cet appareil'
                    : pushState === 'denied'
                      ? 'Bloquées dans le navigateur'
                      : pushState === 'unsupported'
                        ? 'Non supportées ici'
                        : 'Alertes en temps réel disponibles'}
                </div>
              </div>
              {pushState === 'granted' ? (
                <button
                  type="button"
                  onClick={async () => {
                    await sendRushPushNotification(
                      'RUSH · Test Push',
                      'Vos notifications de suivi de livraison sont actives !',
                      '/orders'
                    );
                    pushToast('Notification Push envoyée', 'success');
                  }}
                  className="h-9 px-3.5 rounded-pill bg-green-tint text-success text-[12px] font-black cursor-pointer flex-none"
                >
                  Tester Push
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const next = await requestPushPermission();
                    setPushState(next);
                    pushToast(
                      next === 'granted' ? 'Notifications Push activées !' : `Statut Push : ${next}`,
                      next === 'granted' ? 'success' : 'info'
                    );
                  }}
                  className="h-9 px-3.5 rounded-pill bg-brand text-white text-[12px] font-black shadow-brand cursor-pointer flex-none"
                >
                  Activer Push
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 mx-4 md:mx-0 bg-surface rounded-lg border border-border-warm-light divide-y divide-border-warm-light overflow-hidden shadow-warm-1">
            {accountMenu.map((item, idx) => {
              const content = (
                <div className="flex items-center gap-4 py-3.5 px-4 w-full cursor-pointer hover:bg-bg-app-light transition-colors text-left">
                  <span className="w-10.5 h-10.5 rounded-md bg-bg-app-light text-ink-light flex items-center justify-center flex-none">
                    <Icon name={item.ic} size={20} />
                  </span>
                  <div className="flex-1">
                    <div className="font-extrabold text-[14.5px] text-ink leading-tight">{item.label}</div>
                    <div className="text-[12px] text-ink-placeholder mt-1 font-semibold">{item.sub}</div>
                  </div>
                  <Icon name="chevR" size={19} stroke={2.2} className="text-ink-placeholder flex-none" />
                </div>
              );

              return item.href ? (
                <Link key={idx} href={item.href} className="block">
                  {content}
                </Link>
              ) : (
                <button key={idx} type="button" onClick={item.action || undefined} className="block w-full">
                  {content}
                </button>
              );
            })}
          </div>

          <div className="px-4 md:px-0 mb-6">
            <button
              onClick={() => router.push('/')}
              className="btn btn-outline h-12 w-full border border-brand/20 hover:bg-brand-tint hover:border-brand/40 text-brand font-extrabold text-[14.5px] rounded-pill cursor-pointer transition-colors active:scale-98"
            >
              Retour à l’accueil RUSH
            </button>
          </div>
        </>
      )}

      {/* Vue Mes Adresses */}
      {section === 'addresses' && (
        <div className="px-4 md:px-0 flex flex-col gap-4">
          <div className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <h3 className="font-black text-base text-ink">Mes adresses de livraison</h3>
            {addresses.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-bg-app-light border border-border-warm-light"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[14px] text-ink">{a.label}</span>
                    {a.isDefault && (
                      <span className="px-2 py-0.5 rounded-pill bg-brand-tint text-brand text-[10px] font-black">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] font-semibold text-ink-muted truncate mt-0.5">{a.address}</div>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(a.id)}
                      className="text-[11px] font-black text-ink hover:text-brand cursor-pointer"
                    >
                      Définir défaut
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAddress(a.id)}
                    className="p-1.5 text-ink-placeholder hover:text-brand cursor-pointer"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddAddress}
            className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-3"
          >
            <h3 className="font-black text-base text-ink">Ajouter une adresse</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={addrLabel}
                onChange={(e) => setAddrLabel(e.target.value)}
                placeholder="Nom (ex: Maison, Bureau...)"
                className="bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-semibold text-[13.5px] outline-none"
              />
              <select
                value={addrCityId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setAddrCityId(cid);
                  const first = CAMEROON_ZONES.find((z) => z.cityId === cid);
                  if (first) setAddrZoneId(first.id);
                }}
                className="bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-bold text-[13.5px] outline-none"
              >
                {CAMEROON_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.region})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={addrZoneId}
                onChange={(e) => setAddrZoneId(e.target.value)}
                className="bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-bold text-[13.5px] outline-none"
              >
                {(cityZones.length > 0 ? cityZones : CAMEROON_ZONES).map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.cityName})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                placeholder="Repère / Rue précise..."
                className="bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-semibold text-[13.5px] outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-11 px-5 rounded-pill bg-brand text-white font-black text-[13px] shadow-brand cursor-pointer w-fit"
            >
              Enregistrer l’adresse
            </button>
          </form>
        </div>
      )}

      {/* Vue Favoris */}
      {section === 'favorites' && (
        <div className="px-4 md:px-0 flex flex-col gap-5">
          <div className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <h3 className="font-black text-base text-ink">Produits favoris ({favProducts.length})</h3>
            {favProducts.length === 0 ? (
              <p className="text-[13px] text-ink-muted font-semibold">Aucun produit en favori pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-bg-app-light border border-border-warm-light"
                  >
                    <Link href={productPath(p.id)} className="min-w-0 flex-1">
                      <div className="font-extrabold text-[13.5px] text-ink truncate hover:text-brand">{p.name}</div>
                      <div className="text-[12px] font-black text-brand mt-0.5">{formatPrice(p.price)}</div>
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addToCart(p, 1)}
                        className="h-8 px-3 rounded-pill bg-ink text-white text-[11px] font-black cursor-pointer"
                      >
                        + Panier
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavoriteProduct(p.id, p.name)}
                        className="p-1.5 text-brand cursor-pointer"
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <h3 className="font-black text-base text-ink">Boutiques favorites ({favShops.length})</h3>
            {favShops.length === 0 ? (
              <p className="text-[13px] text-ink-muted font-semibold">Aucune boutique favorite.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favShops.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-bg-app-light border border-border-warm-light"
                  >
                    <Link href={`/categories?shop=${s.id}`} className="min-w-0 flex-1">
                      <div className="font-extrabold text-[13.5px] text-ink truncate hover:text-brand">{s.name}</div>
                      <div className="text-[11.5px] font-semibold text-ink-muted mt-0.5">
                        {s.quarter} · {s.eta_minutes} min
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavoriteShop(s.id, s.name)}
                      className="p-1.5 text-brand cursor-pointer"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vue Notifications */}
      {section === 'notifications' && (
        <div className="px-4 md:px-0">
          <div className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-ink">Centre de notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-[12px] font-black text-brand hover:underline cursor-pointer"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => n.href && router.push(n.href)}
                className={`p-3.5 rounded-lg border transition-colors ${
                  n.href ? 'cursor-pointer' : ''
                } ${n.read ? 'bg-bg-app-light/50 border-border-warm-light' : 'bg-brand-tint/30 border-brand/20'}`}
              >
                <div className="font-extrabold text-[13.5px] text-ink">{n.title}</div>
                <p className="text-[12px] font-semibold text-ink-light mt-1">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vue Codes Promos */}
      {section === 'promos' && (
        <div className="px-4 md:px-0">
          <div className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-ink">Codes promo disponibles</h3>
              <span className="text-[12px] font-black text-success">{userProfile.loyaltyPoints} pts fidélité</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RUSH_PROMOS.map((p) => (
                <div key={p.code} className="p-3.5 rounded-lg bg-bg-app-light border border-border-warm-light flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-[14px] text-ink">{p.code} · {p.discountLabel}</div>
                    <div className="text-[11.5px] font-semibold text-ink-muted mt-0.5">{p.minAmountLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('rush_promo', p.code);
                      pushToast(`Code ${p.code} activé pour votre panier`, 'success', { label: 'Panier', href: '/cart' });
                    }}
                    className="h-8.5 px-3.5 rounded-pill bg-ink text-white text-[11.5px] font-black cursor-pointer hover:bg-brand"
                  >
                    Activer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vue Edition Profil */}
      {section === 'edit' && (
        <div className="px-4 md:px-0">
          <form
            onSubmit={handleSaveProfile}
            className="card bg-surface p-5 rounded-xl border border-border-warm-light shadow-warm-1 flex flex-col gap-4"
          >
            <h3 className="font-black text-base text-ink">Modifier mon profil</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Nom complet</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-semibold text-[14px] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Téléphone (+237)</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  maxLength={9}
                  className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-semibold text-[14px] outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Ville principale</label>
                <select
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-bold text-[14px] outline-none"
                >
                  {CAMEROON_CITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.region})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Paiement préféré</label>
                <select
                  value={payInput}
                  onChange={(e) => setPayInput(e.target.value as 'mtn' | 'orange' | 'cash')}
                  className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 font-bold text-[14px] outline-none"
                >
                  <option value="mtn">MTN Mobile Money</option>
                  <option value="orange">Orange Money</option>
                  <option value="cash">Paiement à la livraison</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="h-11 px-6 rounded-pill bg-brand text-white font-black text-[13px] shadow-brand cursor-pointer"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setSection('menu')}
                className="h-11 px-5 rounded-pill border border-border-warm font-bold text-[13px] cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
