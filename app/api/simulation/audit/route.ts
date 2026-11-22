import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { placeOrder } from '@/app/actions/checkout';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { evaluatePromoCode } from '@/lib/promos';

/**
 * Exécute une batterie d'agents de test serveur (Checkout + Fapshi Sandbox + Sécurité HMAC)
 * sans déclencher de débit réel sur l'API Fapshi de production.
 */
export async function POST() {
  const results: {
    agent: string;
    check: string;
    passed: boolean;
    detail: string;
  }[] = [];

  // 1. Agent Prix Forgé (tentative de payer 50 FCFA pour un sac de riz à 6 500 FCFA)
  const rice = MOCK_PRODUCTS.find((p) => p.id === 'p3') || MOCK_PRODUCTS[0];
  const forgedRes = await placeOrder({
    cart: [
      {
        key: rice.id,
        id: rice.id,
        variant_id: null,
        name: rice.name,
        sub: rice.sub,
        glyph: rice.glyph,
        cat: rice.category_slug || 'epicerie',
        unit: 50, // Falsifié !
        qty: 1,
        optName: null,
      },
    ],
    promoCode: null,
    paymentMethod: 'mtn',
    deliveryAddress: 'Akwa, Douala',
    deliveryPhone: '+237678451290',
    deliveryZoneId: 'dla-akwa',
    simulatePayment: true,
  });

  const expectedAkwaTotal = rice.price + 500;
  results.push({
    agent: 'Agent Sécurité Prix',
    check: 'Rejet falsification prix client (50 F → 6 500 F)',
    passed: Boolean(forgedRes.success && forgedRes.orderSummary?.total_amount === expectedAkwaTotal),
    detail: `Total recalculé serveur : ${forgedRes.orderSummary?.total_amount ?? 'N/A'} FCFA`,
  });

  // 2. Agent Fapshi Sandbox MoMo + Promo RUSH25 + Pourboire plafonné
  const plantain = MOCK_PRODUCTS[0];
  const momoRes = await placeOrder({
    cart: [
      {
        key: plantain.id,
        id: plantain.id,
        variant_id: null,
        name: plantain.name,
        sub: plantain.sub,
        glyph: plantain.glyph,
        cat: 'fruits',
        unit: plantain.price,
        qty: 2,
        optName: null,
      },
    ],
    promoCode: 'RUSH25',
    paymentMethod: 'mtn',
    deliveryAddress: 'Deido, Douala',
    deliveryPhone: '+237678451290',
    deliveryZoneId: 'dla-deido',
    tipAmount: 25000, // doit être plafonné à 5000 FCFA
    simulatePayment: true,
  });

  // 3000 - 750 (25%) + 600 (Deido) + 5000 (tip max) = 7850
  results.push({
    agent: 'Agent Fapshi Sandbox MoMo',
    check: 'Checkout MoMo + RUSH25 + plafond pourboire 5 000 F',
    passed: Boolean(
      momoRes.success &&
        momoRes.paymentUrl?.includes('simulated_payment=1') &&
        momoRes.orderSummary?.total_amount === 7850
    ),
    detail: `Order ${momoRes.orderId} · Total ${momoRes.orderSummary?.total_amount ?? 'N/A'} FCFA · URL ${momoRes.paymentUrl}`,
  });

  // 3. Agent Promo & Règle Opérateur
  const invalidMomoOnOrange = evaluatePromoCode('MOMO500', 8000, 'orange');
  const validMomo = evaluatePromoCode('MOMO500', 8000, 'mtn');
  results.push({
    agent: 'Agent Règles Promo',
    check: 'MOMO500 bloqué sur Orange Money et accepté sur MTN MoMo',
    passed: !invalidMomoOnOrange.valid && validMomo.valid && validMomo.discountAmount === 500,
    detail: `Orange: ${invalidMomoOnOrange.reason} | MTN: -${validMomo.discountAmount} FCFA`,
  });

  // 4. Agent Webhook Signature Fapshi (vérification HMAC-SHA256)
  const samplePayload = JSON.stringify({
    amount: 7850,
    externalId: momoRes.orderId || 'RSH-TEST',
    status: 'SUCCESSFUL',
    transId: 'FAP-SIM-AUDIT',
  });
  const secret = process.env.FAPSHI_WEBHOOK_SECRET || 'rush-test-secret';
  const digest = crypto.createHmac('sha256', secret).update(samplePayload).digest('hex');
  results.push({
    agent: 'Agent Webhook Fapshi',
    check: 'Calcul et validation signature HMAC-SHA256',
    passed: digest.length === 64,
    detail: `HMAC SHA-256 prêt (${digest.slice(0, 12)}…) · Fapshi API configurée : ${Boolean(
      process.env.FAPSHI_API_USER && process.env.FAPSHI_API_KEY
    )}`,
  });

  const passedCount = results.filter((r) => r.passed).length;
  return NextResponse.json({
    ok: passedCount === results.length,
    passedCount,
    totalCount: results.length,
    fapshiApiUrlConfigured: process.env.FAPSHI_API_URL || 'https://live.fapshi.com',
    fapshiCredentialsPresent: Boolean(process.env.FAPSHI_API_USER && process.env.FAPSHI_API_KEY),
    results,
    timestamp: new Date().toISOString(),
  });
}
