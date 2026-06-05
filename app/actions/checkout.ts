'use server';

import { createClient } from '@/lib/supabase/server';
import { CartItem, Order, OrderStatus, PaymentMethod } from '@/types';
import { MOCK_PRODUCTS, getVariantsForProduct, MOCK_SHOPS } from '@/lib/mock-data';
import { initiatePayment } from '@/lib/fapshi';

interface PlaceOrderParams {
  cart: CartItem[];
  promoCode: string | null;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  deliveryPhone: string;
  note?: string;
}

interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  message?: string;
}

export async function placeOrder({
  cart,
  promoCode,
  paymentMethod,
  deliveryAddress,
  deliveryPhone,
  note = '',
}: PlaceOrderParams): Promise<PlaceOrderResult> {
  
  if (!cart || cart.length === 0) {
    return { success: false, message: 'Le panier est vide.' };
  }

  // 1. Recalcul et validation stricte des prix côté serveur
  let subtotal = 0;
  const verifiedItems = [];

  for (const item of cart) {
    // Récupérer le vrai produit en base de données / mock
    const product = MOCK_PRODUCTS.find((p) => p.id === item.id);
    if (!product) {
      return { success: false, message: `Produit introuvable : ${item.name}` };
    }

    // Vérifier le stock
    if (product.stock < item.qty) {
      return { success: false, message: `Stock insuffisant pour ${product.name}. Disponible : ${product.stock}` };
    }

    // Valider la variante et récupérer le différentiel de prix
    let priceDelta = 0;
    let variantName = null;
    if (item.variant_id) {
      const variants = getVariantsForProduct(product);
      const v = variants.find((opt) => opt.id === item.variant_id);
      if (!v) {
        return { success: false, message: `Variante invalide pour ${product.name}` };
      }
      priceDelta = v.price_delta;
      variantName = v.name;
    }

    const unitPrice = product.price + priceDelta;
    const itemTotal = unitPrice * item.qty;
    subtotal += itemTotal;

    verifiedItems.push({
      product_id: product.id,
      product_name: product.name,
      variant_name: variantName,
      quantity: item.qty,
      unit_price: unitPrice,
      total_price: itemTotal,
    });
  }

  // 2. Validation des frais de livraison
  const deliveryThreshold = 10000;
  const deliveryFee = subtotal >= deliveryThreshold ? 0 : 700;

  // 3. Validation de code promo
  let discountAmount = 0;
  if (promoCode && promoCode.trim().toUpperCase() === 'RUSH25') {
    discountAmount = Math.round(subtotal * 0.25);
  }

  const finalTotal = subtotal + deliveryFee - discountAmount;

  // 4. Calcul des commissions & payouts de la plateforme (10% sur articles, 20% sur livraison)
  const platformCommissionRate = 0.10;
  const platformFee = Math.round(subtotal * platformCommissionRate) + Math.round(deliveryFee * 0.20);
  const vendorPayout = subtotal - Math.round(subtotal * platformCommissionRate);
  const courierPayout = deliveryFee - Math.round(deliveryFee * 0.20);

  // 5. Génération d'un ID de commande lisible (ex: RSH-20512)
  const orderId = `RSH-${Math.floor(Math.random() * 90000 + 10000)}`;

  // 6. Sauvegarde dans Supabase si connecté
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Écriture de la commande avec commissions calculées
      const { error: orderError } = await supabase.from('orders').insert({
        id: orderId,
        user_id: user.id,
        shop_id: cart[0] ? MOCK_PRODUCTS.find(p => p.id === cart[0].id)?.shop_id : null,
        status: (paymentMethod === 'cash' ? 'confirmed' : 'pending') as OrderStatus,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        total_amount: finalTotal,
        delivery_address: deliveryAddress,
        delivery_phone: deliveryPhone,
        courier_name: null, // aucun livreur assigné au départ
        courier_phone: null,
        note,
        platform_commission_rate: platformCommissionRate,
        platform_fee: platformFee,
        vendor_payout: vendorPayout,
        courier_payout: courierPayout,
      });

      if (orderError) {
        console.error('Erreur Supabase insertion commande:', orderError);
      } else {
        // Écriture des articles de commande
        const itemsToInsert = verifiedItems.map(item => ({
          order_id: orderId,
          product_id: item.product_id,
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));
        await supabase.from('order_items').insert(itemsToInsert);

        // Écriture du jalon initial
        await supabase.from('order_status_events').insert({
          order_id: orderId,
          status: (paymentMethod === 'cash' ? 'confirmed' : 'pending') as OrderStatus,
          notes: paymentMethod === 'cash' ? 'Commande payée à la livraison' : 'En attente de paiement mobile money',
        });

        // 7. Création de la livraison associée en statut pending_assignment
        const shopId = cart[0] ? MOCK_PRODUCTS.find(p => p.id === cart[0].id)?.shop_id : null;
        const shopObj = MOCK_SHOPS.find(s => s.id === shopId);
        const pickupAddress = shopObj ? `${shopObj.name}, Douala` : 'Boutique RUSH';

        await supabase.from('deliveries').insert({
          order_id: orderId,
          courier_id: null,
          status: 'pending_assignment',
          pickup_address: pickupAddress,
          dropoff_address: deliveryAddress,
          delivery_fee: deliveryFee,
          courier_payout: courierPayout,
        });
      }
    }
  } catch (err) {
    console.warn('Supabase non disponible ou erreur serveur. Exécution simulée active.');
  }

  // 8. Gestion du paiement avec Fapshi (MoMo / OM)
  if (paymentMethod === 'mtn' || paymentMethod === 'orange') {
    const redirectUrl = `${process.env.APP_URL || 'http://localhost:3000'}/orders/${orderId}?status=success`;
    const payment = await initiatePayment({
      amount: finalTotal,
      phone: deliveryPhone,
      externalId: orderId,
      redirectUrl: redirectUrl,
    });

    if (payment.success) {
      return {
        success: true,
        orderId,
        paymentUrl: payment.paymentUrl,
        message: 'Commande créée. En attente de paiement.',
      };
    } else {
      return {
        success: false,
        message: payment.message || 'Impossible d\'initier le paiement mobile money. Veuillez réessayer.',
      };
    }
  }

  // 9. Paiement à la livraison
  return {
    success: true,
    orderId,
    paymentUrl: `/orders/${orderId}?confirm_cash=1`,
    message: 'Commande validée avec succès.',
  };
}
