'use server';

import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CartItem, Order, OrderStatus, PaymentMethod } from '@/types';
import { MOCK_PRODUCTS, getVariantsForProduct, MOCK_SHOPS } from '@/lib/mock-data';
import { initiatePayment } from '@/lib/fapshi';
import { evaluatePromoCode } from '@/lib/promos';
import { CAMEROON_ZONES } from '@/lib/cameroon-geo';

interface PlaceOrderParams {
  cart: CartItem[];
  promoCode: string | null;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  deliveryPhone: string;
  note?: string;
  deliveryZoneId?: string | null;
  deliveryLat?: number;
  deliveryLng?: number;
  tipAmount?: number;
  scheduledSlot?: string;
  substitutionPref?: 'call' | 'replace' | 'refund';
  simulatePayment?: boolean;
}

interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  message?: string;
  orderSummary?: Order;
}

export async function placeOrder({
  cart,
  promoCode,
  paymentMethod,
  deliveryAddress,
  deliveryPhone,
  note = '',
  deliveryZoneId = null,
  deliveryLat,
  deliveryLng,
  tipAmount = 0,
  scheduledSlot = 'express',
  substitutionPref = 'call',
  simulatePayment = false,
}: PlaceOrderParams): Promise<PlaceOrderResult> {
  if (!cart || cart.length === 0) {
    return { success: false, message: 'Le panier est vide.' };
  }

  // 1. Recalcul et validation stricte des prix côté serveur
  let subtotal = 0;
  const verifiedItems: {
    product_id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[] = [];

  for (const item of cart) {
    const product = MOCK_PRODUCTS.find((p) => p.id === item.id);
    if (!product) {
      return { success: false, message: `Produit introuvable : ${item.name}` };
    }

    if (product.stock < item.qty) {
      return { success: false, message: `Stock insuffisant pour ${product.name}. Disponible : ${product.stock}` };
    }

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

  // 2. Validation des frais de livraison (zone Cameroun ou défaut 700 FCFA, gratuit >= 10 000 FCFA)
  const matchedZone = deliveryZoneId ? CAMEROON_ZONES.find((z) => z.id === deliveryZoneId) : null;
  const baseZoneFee = matchedZone ? matchedZone.deliveryFee : 700;
  const promoEval = evaluatePromoCode(promoCode, subtotal, paymentMethod);
  const deliveryThreshold = 10000;
  const deliveryFee = subtotal >= deliveryThreshold || promoEval.freeDelivery ? 0 : baseZoneFee;

  // 3. Validation de code promo unifiée & pourboire Rusher sécurisé (0 à 5 000 FCFA, 100% au livreur)
  const discountAmount = promoEval.valid ? promoEval.discountAmount : 0;
  const safeTip = Math.max(0, Math.min(5000, Math.round(Number(tipAmount) || 0)));
  const finalTotal = Math.max(0, subtotal + deliveryFee + safeTip - discountAmount);

  // 4. Calcul des commissions & payouts de la plateforme (10% sur articles, 20% sur livraison, 0% sur pourboire)
  const platformCommissionRate = 0.10;
  const platformFee = Math.round(subtotal * platformCommissionRate) + Math.round(deliveryFee * 0.20);
  const vendorPayout = subtotal - Math.round(subtotal * platformCommissionRate);
  const courierPayout = deliveryFee - Math.round(deliveryFee * 0.20) + safeTip;

  // 5. Génération cryptographique CSPRNG de l'ID de commande et du code PIN de remise colis
  const orderId = `RSH-${crypto.randomInt(100000, 999999)}`;
  const deliveryPin = String(crypto.randomInt(1000, 9999));
  const primaryShopId = cart[0] ? MOCK_PRODUCTS.find((p) => p.id === cart[0].id)?.shop_id ?? null : null;
  const primaryShop = MOCK_SHOPS.find((s) => s.id === primaryShopId);
  const initialStatus: OrderStatus = paymentMethod === 'cash' ? 'confirmed' : 'confirmed';
  const nowIso = new Date().toISOString();

  // 6. Sauvegarde dans Supabase (invités ET utilisateurs connectés) via client admin serveur après recalcul vérifié
  const isUuid = (val: string | null | undefined): boolean =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminDb = await createAdminClient();
    const dbStatus: OrderStatus = paymentMethod === 'cash' ? 'confirmed' : 'pending';
    const dbShopId = isUuid(primaryShopId) ? primaryShopId : null;

    const { error: orderError } = await adminDb.from('orders').insert({
      id: orderId,
      user_id: user?.id ?? null,
      shop_id: dbShopId,
      status: dbStatus,
      subtotal,
      delivery_fee: deliveryFee,
      discount_amount: discountAmount,
      total_amount: finalTotal,
      delivery_address: deliveryAddress,
      delivery_phone: deliveryPhone,
      courier_name: null,
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
      await adminDb.from('order_items').insert(
        verifiedItems.map((item) => ({
          order_id: orderId,
          product_id: isUuid(item.product_id) ? item.product_id : null,
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      );

      await adminDb.from('order_status_events').insert({
        order_id: orderId,
        status: dbStatus,
        notes: paymentMethod === 'cash' ? 'Commande payée à la livraison' : 'En attente de paiement mobile money',
      });

      const pickupAddress = primaryShop ? `${primaryShop.name}, Douala` : 'Boutique RUSH';
      await adminDb.from('deliveries').insert({
        order_id: orderId,
        courier_id: null,
        status: 'pending_assignment',
        pickup_address: pickupAddress,
        dropoff_address: deliveryAddress,
        delivery_fee: deliveryFee,
        courier_payout: courierPayout,
      });
    }
  } catch {
    console.warn('Supabase non disponible ou erreur serveur. Exécution simulée active.');
  }

  const orderSummary: Order = {
    id: orderId,
    user_id: null,
    shop_id: primaryShopId,
    courier_id: null,
    status: initialStatus,
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discountAmount,
    total_amount: finalTotal,
    delivery_address: deliveryAddress,
    delivery_phone: deliveryPhone,
    courier_name: 'Eric N.',
    courier_phone: '+237 6 77 11 22 33',
    eta_minutes: matchedZone?.etaMinutes ?? 25,
    note: note || null,
    delivery_zone_id: deliveryZoneId,
    promo_code_id: promoEval.valid ? promoEval.promo?.code ?? null : null,
    promo_code: promoEval.valid ? promoEval.promo?.code ?? null : null,
    created_at: nowIso,
    updated_at: nowIso,
    shop_name: primaryShop?.name || 'Boutique Partenaire RUSH',
    delivery_lat: deliveryLat ?? matchedZone?.lat,
    delivery_lng: deliveryLng ?? matchedZone?.lng,
    delivery_city: matchedZone?.cityName || 'Douala',
    delivery_zone: matchedZone?.name || undefined,
    delivery_pin: deliveryPin,
    tip_amount: safeTip,
    scheduled_slot: scheduledSlot,
    substitution_pref: substitutionPref,
    payment_method: paymentMethod,
    items: verifiedItems.map((i) => ({
      product_id: i.product_id,
      name: i.product_name,
      qty: i.quantity,
      unit_price: i.unit_price,
      variant_name: i.variant_name,
    })),
    timeline: [
      {
        status: 'confirmed',
        label: 'Commande confirmée',
        note:
          paymentMethod === 'cash'
            ? 'Paiement en espèces prévu à la livraison'
            : `Paiement ${paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'} initié`,
        at: nowIso,
      },
    ],
  };

  // 8. Gestion du paiement avec Fapshi (MoMo / OM)
  if (paymentMethod === 'mtn' || paymentMethod === 'orange') {
    const baseUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const redirectUrl = `${baseUrl}/orders/${orderId}?status=success`;
    const payment = await initiatePayment({
      amount: finalTotal,
      phone: deliveryPhone,
      externalId: orderId,
      redirectUrl,
      simulate: simulatePayment,
    });

    if (payment.success) {
      return {
        success: true,
        orderId,
        paymentUrl: payment.paymentUrl,
        message: 'Commande créée. En attente de paiement.',
        orderSummary,
      };
    }

    return {
      success: false,
      message: payment.message || "Impossible d'initier le paiement mobile money. Veuillez réessayer.",
    };
  }

  // 9. Paiement à la livraison
  return {
    success: true,
    orderId,
    paymentUrl: `/orders/${orderId}?confirm_cash=1`,
    message: 'Commande validée avec succès.',
    orderSummary,
  };
}
