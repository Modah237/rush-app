'use server';

import { createClient } from '@/lib/supabase/server';
import { CartItem } from '@/types';

/**
 * Synchronise le panier local (Client) avec la base de données (Serveur)
 */
export async function syncCart(cart: CartItem[], userId?: string | null, sessionId?: string | null) {
  if (!userId && !sessionId) {
    return { success: false, message: 'Aucun identifiant utilisateur ou session fourni.' };
  }

  try {
    const supabase = await createClient();
    let cartId = null;

    // 1. Trouver ou créer le panier
    if (userId) {
      const { data: userCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (userCart) {
        cartId = userCart.id;
      } else {
        const { data: newCart, error } = await supabase
          .from('carts')
          .insert({ user_id: userId })
          .select('id')
          .single();
        if (error) throw error;
        cartId = newCart.id;
      }
    } else if (sessionId) {
      const { data: guestCart } = await supabase
        .from('carts')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (guestCart) {
        cartId = guestCart.id;
      } else {
        const { data: newCart, error } = await supabase
          .from('carts')
          .insert({ session_id: sessionId })
          .select('id')
          .single();
        if (error) throw error;
        cartId = newCart.id;
      }
    }

    if (!cartId) return { success: false, message: 'Impossible de gérer le panier.' };

    // 2. Vider les anciens éléments associés à ce panier
    await supabase.from('cart_items').delete().eq('cart_id', cartId);

    // 3. Ré-insérer tous les éléments actuels en lot
    if (cart.length > 0) {
      const itemsToInsert = cart.map(item => ({
        cart_id: cartId,
        product_id: item.id,
        variant_id: item.variant_id,
        quantity: item.qty,
      }));

      const { error: insertError } = await supabase.from('cart_items').insert(itemsToInsert);
      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (err) {
    console.error('Erreur synchronisation panier serveur:', err);
    return { success: false, message: 'Erreur de synchronisation panier.' };
  }
}

/**
 * Fusionne un panier invité (sessionId) dans le panier d'un utilisateur connecté (userId)
 */
export async function mergeGuestCart(sessionId: string, userId: string) {
  try {
    const supabase = await createClient();

    // 1. Récupérer le panier invité
    const { data: guestCart } = await supabase
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!guestCart) return { success: true }; // Aucun panier invité à fusionner

    // 2. Récupérer les items du panier invité
    const { data: guestItems } = await supabase
      .from('cart_items')
      .select('product_id, variant_id, quantity')
      .eq('cart_id', guestCart.id);

    if (!guestItems || guestItems.length === 0) {
      // Panier invité vide, supprimer simplement la ligne carts
      await supabase.from('carts').delete().eq('id', guestCart.id);
      return { success: true };
    }

    // 3. Trouver ou créer le panier utilisateur
    let userCartId = null;
    const { data: userCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (userCart) {
      userCartId = userCart.id;
    } else {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ user_id: userId })
        .select('id')
        .single();
      if (error) throw error;
      userCartId = newCart.id;
    }

    // 4. Fusionner les items en base
    for (const guestItem of guestItems) {
      // Vérifier si l'item existe déjà dans le panier de l'utilisateur
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', userCartId)
        .eq('product_id', guestItem.product_id)
        .filter('variant_id', guestItem.variant_id ? 'eq' : 'is', guestItem.variant_id)
        .maybeSingle();

      if (existingItem) {
        // Additionner la quantité
        await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + guestItem.quantity })
          .eq('id', existingItem.id);
      } else {
        // Insérer un nouvel élément
        await supabase.from('cart_items').insert({
          cart_id: userCartId,
          product_id: guestItem.product_id,
          variant_id: guestItem.variant_id,
          quantity: guestItem.quantity,
        });
      }
    }

    // 5. Supprimer le panier invité
    await supabase.from('carts').delete().eq('id', guestCart.id);

    return { success: true };
  } catch (err) {
    console.error('Erreur fusion paniers invité/connecté:', err);
    return { success: false, message: 'Erreur de fusion du panier.' };
  }
}
