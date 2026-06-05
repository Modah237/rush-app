'use client';

import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_SHOPS, MOCK_ORDERS } from '@/lib/mock-data';
import { Product, Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';
import Icon from '@/components/shared/icon';
import SafeImage from '@/components/shared/safe-image';
import { createClient } from '@/lib/supabase/client';
import { createSubscriptionPayment } from '@/app/actions/subscription';

export default function MerchantPage() {
  const shop = MOCK_SHOPS[0]; // Mahima Supermarché par défaut pour la démo
  const [products, setProducts] = useState<Product[]>(
    MOCK_PRODUCTS.filter((p) => p.shop_id === shop.id)
  );
  const [orders, setOrders] = useState<Order[]>(
    MOCK_ORDERS.filter((o) => o.shop_id === shop.id)
  );

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'subscription'>('products');
  const [isSubscribed, setIsSubscribed] = useState(shop.subscription_status === 'active');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Charger la session utilisateur et gérer la redirection du paiement Sandbox
  useEffect(() => {
    async function loadSession() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (err) {
        console.warn('Erreur Supabase session:', err);
      }
    }
    loadSession();

    // Intercepter la simulation Sandbox de paiement Fapshi
    const params = new URLSearchParams(window.location.search);
    if (params.get('simulated_subscription') === '1') {
      setIsSubscribed(true);
      setActiveTab('subscription');
      
      // Mettre à jour la base locale pour la simulation
      async function activateDB() {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const subIdRaw = params.get('sub_id');
            const subId = subIdRaw?.startsWith('SUB-') ? subIdRaw.slice(4) : subIdRaw;
            if (subId) {
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + 30);
              
              await supabase.from('vendor_subscriptions').update({
                status: 'active',
                starts_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
              }).eq('id', subId);

              await supabase.from('shops').update({
                subscription_status: 'active',
                subscription_expires_at: expiresAt.toISOString()
              }).eq('owner_id', user.id);
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }
      activateDB();
    }
  }, []);

  // Formulaire d'ajout produit
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductSub, setNewProductSub] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('epicerie');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductPrice) return;

    const newProd: Product = {
      id: `p-${Date.now()}`,
      shop_id: shop.id,
      category_id: newProductCategory,
      name: newProductName,
      sub: newProductSub,
      price: parseInt(newProductPrice),
      old_price: null,
      rating: 5.0,
      sold_count: '0',
      glyph: 'basket',
      tag: 'Nouveau',
      stock: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      shop_name: shop.name,
      category_slug: newProductCategory,
    };

    setProducts([newProd, ...products]);
    setNewProductName('');
    setNewProductPrice('');
    setNewProductSub('');
    setShowAddForm(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handlePaySubscription = async () => {
    setIsLoading(true);
    try {
      const targetVendorId = userId || shop.owner_id;
      const res = await createSubscriptionPayment(targetVendorId);
      if (res.success && res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        alert(res.message || "Erreur lors de l'initialisation de l'abonnement.");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur serveur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-enter flex flex-col gap-5 px-4 md:px-0 mt-4 pb-12">
      {/* Header Boutique */}
      <div className="bg-gradient-to-br from-ink to-ink-light text-white p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-warm-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center">
              <Icon name={shop.glyph} size={20} className="text-brand" />
            </span>
            <h1 className="font-black text-xl tracking-tight">{shop.name}</h1>
          </div>
          <p className="text-[12px] text-white/60 font-semibold mt-1">
            Rush merchants · {shop.category} · Douala, Cameroun
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`badge font-black text-[11px] px-2.5 py-1 rounded-pill ${
            isSubscribed ? 'bg-green-tint text-success' : 'bg-brand-tint text-brand'
          }`}>
            {isSubscribed ? 'Abonnement Actif' : 'Abonnement Suspendu'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 h-10 rounded-md font-bold text-[13.5px] transition-colors cursor-pointer ${
            activeTab === 'products' ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
          }`}
        >
          Mon Catalogue ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 h-10 rounded-md font-bold text-[13.5px] transition-colors cursor-pointer ${
            activeTab === 'orders' ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
          }`}
        >
          Commandes Reçues ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex-1 h-10 rounded-md font-bold text-[13.5px] transition-colors cursor-pointer ${
            activeTab === 'subscription' ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
          }`}
        >
          Mon Abonnement
        </button>
      </div>

      {/* Panel 1 : Catalogue Produits */}
      {activeTab === 'products' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg text-ink">Liste des produits</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-primary h-9 bg-brand text-white font-extrabold text-[12.5px] px-4 rounded-pill cursor-pointer hover:bg-brand-hover active:scale-95 transition-transform"
            >
              + Ajouter un produit
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddProduct} className="card bg-surface p-5 rounded-lg border border-border-warm shadow-warm-1 flex flex-col gap-3.5">
              <h3 className="font-bold text-[14.5px] text-ink">Nouveau produit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Nom du produit</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ex. Sac de riz premium"
                    className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Prix (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Ex. 6500"
                    className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Description courte (sous-titre)</label>
                  <input
                    type="text"
                    value={newProductSub}
                    onChange={(e) => setNewProductSub(e.target.value)}
                    placeholder="Ex. Sac 5 kg"
                    className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-ink-light mb-1">Catégorie</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full bg-bg-app-light border border-border-warm rounded-md px-3.5 h-11 outline-none text-ink font-bold"
                  >
                    <option value="epicerie">Épicerie</option>
                    <option value="fruits">Fruits & Légumes</option>
                    <option value="boissons">Boissons</option>
                    <option value="resto">Restaurant</option>
                    <option value="maison">Maison & Soins</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-outline h-9.5 text-[12.5px] font-bold px-4 rounded-pill border border-border-warm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary h-9.5 bg-brand text-white font-extrabold text-[12.5px] px-5 rounded-pill"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {products.map((p) => (
              <div key={p.id} className="card bg-surface p-3.5 rounded-lg shadow-warm-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md overflow-hidden flex-none">
                    <SafeImage
                      src={p.image_url}
                      alt={p.name}
                      fallbackIcon={p.glyph}
                      fallbackTint="#FFE9EB"
                      fallbackInk="var(--brand)"
                      radius="6px"
                      aspectRatio="square"
                    />
                  </div>
                  <div>
                    <div className="font-extrabold text-[14.5px] text-ink">{p.name}</div>
                    <div className="text-[11.5px] text-ink-placeholder mt-0.5 font-semibold">
                      {formatPrice(p.price)} · Stock : <span className="text-ink font-extrabold">{p.stock}</span>
                    </div>
                  </div>
                </div>
                
                <button className="badge badge-ghost bg-bg-app-light hover:bg-border-warm text-ink-light font-extrabold text-[11px] px-2.5 py-1 rounded-pill cursor-pointer transition-colors">
                  Modifier
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Panel 2 : Commandes Reçues */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          <h2 className="font-black text-lg text-ink">Suivi des commandes</h2>
          {orders.map((o) => (
            <div key={o.id} className="card bg-surface p-4.5 rounded-lg shadow-warm-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-black text-[14.5px] text-ink">{o.id}</span>
                  <span className="text-[12px] text-ink-placeholder font-semibold ml-2">Total : {formatPrice(o.total_amount)}</span>
                </div>
                <span className="badge bg-amber-tint text-warning font-black text-[11px] px-2 py-0.5 rounded-pill">
                  {o.status}
                </span>
              </div>

              {o.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateOrderStatus(o.id, 'preparing')}
                  className="btn btn-primary h-9 bg-brand hover:bg-brand-hover text-white text-[12px] font-extrabold px-4 rounded-pill cursor-pointer mt-1 w-fit"
                >
                  Commencer la préparation
                </button>
              )}
              
              {o.status === 'preparing' && (
                <button
                  onClick={() => handleUpdateOrderStatus(o.id, 'out_for_delivery')}
                  className="btn btn-primary h-9 bg-success text-white text-[12px] font-extrabold px-4 rounded-pill cursor-pointer mt-1 w-fit"
                >
                  Prêt : Remettre au livreur
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Panel 3 : Abonnement Boutique */}
      {activeTab === 'subscription' && (
        <div className="card bg-surface p-5 rounded-lg shadow-warm-1 flex flex-col gap-4.5">
          <h2 className="font-black text-lg text-ink">Formule d'abonnement commerçant</h2>
          
          <div className="border border-border-warm rounded-md p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="font-black text-lg text-ink">Abonnement RUSH Pro</div>
              <div className="text-[13.5px] text-ink-muted mt-1 leading-relaxed">
                Accès illimité à la plateforme, mise en ligne du catalogue produits et réception des commandes clients.
              </div>
              <div className="font-black text-xl text-brand mt-2">15 000 FCFA / mois</div>
            </div>

            {!isSubscribed ? (
              <button
                onClick={handlePaySubscription}
                disabled={isLoading}
                className="btn btn-primary h-11 bg-brand text-white font-extrabold text-[13.5px] px-6 rounded-pill shadow-brand cursor-pointer hover:bg-brand-hover disabled:bg-brand/50"
              >
                {isLoading ? 'Redirection...' : "Payer l'abonnement (MoMo/OM)"}
              </button>
            ) : (
              <div className="text-right">
                <span className="badge bg-green-tint text-success font-black text-[12px] px-3 py-1 rounded-pill">
                  Abonnement actif
                </span>
                <div className="text-[11.5px] text-ink-placeholder mt-2 font-bold">Expire le : 30 juin 2026</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
