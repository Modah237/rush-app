'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { syncCart, mergeGuestCart } from '@/app/actions/cart';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, qty?: number, variant?: ProductVariant | null) => void;
  removeFromCart: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // 1. Charger le panier et gérer l'identité session au montage
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('rush_cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error('Erreur de chargement du panier:', e);
    }

    // Gérer la session invité anonyme
    let sId = localStorage.getItem('rush_session_id');
    if (!sId) {
      sId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('rush_session_id', sId);
    }
    setSessionId(sId);
    setIsLoaded(true);
  }, []);

  // 2. Écouter les changements d'authentification pour la fusion du panier
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        const guestId = localStorage.getItem('rush_session_id');
        if (guestId) {
          await mergeGuestCart(guestId, session.user.id);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const guestId = localStorage.getItem('rush_session_id');
        if (guestId) {
          await mergeGuestCart(guestId, session.user.id);
        }
      } else {
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Sauvegarder dans localStorage + Synchroniser avec le serveur
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('rush_cart', JSON.stringify(cart));
      syncCart(cart, userId, sessionId);
    }
  }, [cart, isLoaded, userId, sessionId]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.unit * item.qty, 0);

  const addToCart = (product: Product, qty = 1, variant: ProductVariant | null = null) => {
    const key = product.id + (variant ? `:${variant.id}` : '');
    const unitPrice = product.price + (variant ? variant.price_delta : 0);

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.key === key);
      
      if (existingItemIndex > -1) {
        // Mettre à jour la quantité
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          qty: updatedCart[existingItemIndex].qty + qty,
        };
        return updatedCart;
      } else {
        // Ajouter un nouvel élément
        return [
          ...prevCart,
          {
            key,
            id: product.id,
            variant_id: variant ? variant.id : null,
            name: product.name,
            sub: product.sub,
            glyph: product.glyph,
            cat: product.category_slug || 'epicerie',
            unit: unitPrice,
            qty,
            optName: variant ? variant.name : null,
          },
        ];
      }
    });
  };

  const removeFromCart = (key: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.key !== key));
  };

  const updateQty = (key: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(key);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.key === key ? { ...item, qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart doit être utilisé au sein d\'un CartProvider');
  }
  return context;
};
