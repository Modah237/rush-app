import { Order, OrderStatus, PaymentMethod } from '@/types';
import { MOCK_PRODUCTS, MOCK_SHOPS } from '@/lib/mock-data';
import { CAMEROON_ZONES, calculateDistanceKm } from '@/lib/cameroon-geo';
import { evaluatePromoCode } from '@/lib/promos';

export type GtaActorRole = 'client' | 'rusher' | 'merchant' | 'chaos';
export type GtaLogKind = 'CLIENT' | 'RUSHER' | 'BOUTIQUE' | 'FAPSHI' | 'CHAOS';

export interface GtaActor {
  id: string;
  name: string;
  role: GtaActorRole;
  cityId: string;
  zoneId: string;
  lat: number;
  lng: number;
  homeLat: number;
  homeLng: number;
  status: 'idle' | 'ordering' | 'preparing' | 'delivering' | 'auditing';
  vehicle?: string;
  activeOrderId?: string | null;
  progress?: number; // 0..1 when delivering
  balanceFcfa: number;
  missionsCompleted: number;
  lastAction: string;
}

export interface GtaFeedLog {
  id: string;
  tick: number;
  kind: GtaLogKind;
  actorName: string;
  message: string;
  orderId?: string;
  ok: boolean;
  at: string;
}

export interface GtaWorldStats {
  totalOrders: number;
  deliveredCount: number;
  gmvFcfa: number;
  platformCommissionsFcfa: number;
  rusherEarningsFcfa: number;
  fapshiSimulatedCount: number;
  chaosBlockedCount: number;
  chaosTotalCount: number;
}

export interface GtaWorldState {
  tick: number;
  actors: GtaActor[];
  orders: Order[];
  logs: GtaFeedLog[];
  stats: GtaWorldStats;
}

const CLIENT_TEMPLATES = [
  { id: 'npc-c1', name: 'Aïssatou M.', zoneId: 'dla-akwa', lat: 4.0536, lng: 9.6989, cityId: 'douala' },
  { id: 'npc-c2', name: 'Jean-Paul K.', zoneId: 'yde-bastos', lat: 3.8927, lng: 11.5122, cityId: 'yaounde' },
  { id: 'npc-c3', name: 'Kévin T.', zoneId: 'dla-bonamoussadi', lat: 4.0888, lng: 9.7364, cityId: 'douala' },
  { id: 'npc-c4', name: 'Chantal N.', zoneId: 'dla-bonapriso', lat: 4.0273, lng: 9.7014, cityId: 'douala' },
];

const RUSHER_TEMPLATES = [
  { id: 'npc-r1', name: 'Eric N.', vehicle: 'Moto Yamaha', zoneId: 'dla-akwa', lat: 4.0512, lng: 9.7025, cityId: 'douala' },
  { id: 'npc-r2', name: 'Brice T.', vehicle: 'Moto Boxer', zoneId: 'dla-deido', lat: 4.0625, lng: 9.7135, cityId: 'douala' },
  { id: 'npc-r3', name: 'Sandra M.', vehicle: 'Moto Haojue', zoneId: 'dla-makepe', lat: 4.0752, lng: 9.7443, cityId: 'douala' },
  { id: 'npc-r4', name: 'Samuel K.', vehicle: 'Moto Sanili', zoneId: 'yde-centre', lat: 3.8725, lng: 11.5155, cityId: 'yaounde' },
];

export function createInitialGtaWorld(): GtaWorldState {
  const actors: GtaActor[] = [
    ...CLIENT_TEMPLATES.map((c) => ({
      ...c,
      role: 'client' as const,
      homeLat: c.lat,
      homeLng: c.lng,
      status: 'idle' as const,
      activeOrderId: null,
      balanceFcfa: 50000,
      missionsCompleted: 0,
      lastAction: 'Prêt à commander',
    })),
    ...RUSHER_TEMPLATES.map((r) => ({
      ...r,
      role: 'rusher' as const,
      homeLat: r.lat,
      homeLng: r.lng,
      status: 'idle' as const,
      activeOrderId: null,
      progress: 0,
      balanceFcfa: 0,
      missionsCompleted: 0,
      lastAction: 'En patrouille libre',
    })),
    {
      id: 'npc-chaos',
      name: 'Inspecteur Chaos',
      role: 'chaos',
      cityId: 'douala',
      zoneId: 'dla-bonanjo',
      lat: 4.0419,
      lng: 9.6873,
      homeLat: 4.0419,
      homeLng: 9.6873,
      status: 'auditing',
      activeOrderId: null,
      balanceFcfa: 0,
      missionsCompleted: 0,
      lastAction: 'En attente de sonde sécurité',
    },
  ];

  return {
    tick: 0,
    actors,
    orders: [],
    logs: [
      {
        id: 'gta-init',
        tick: 0,
        kind: 'CHAOS',
        actorName: 'Système RUSH',
        message: 'Arène Agents IA initialisée à Douala & Yaoundé (Clients, Rushers, Boutiques, Fapshi Sandbox, Chaos).',
        ok: true,
        at: new Date().toISOString(),
      },
    ],
    stats: {
      totalOrders: 0,
      deliveredCount: 0,
      gmvFcfa: 0,
      platformCommissionsFcfa: 0,
      rusherEarningsFcfa: 0,
      fapshiSimulatedCount: 0,
      chaosBlockedCount: 0,
      chaosTotalCount: 0,
    },
  };
}

function makeOrderFromClient(client: GtaActor, tick: number, seed: number): {
  order: Order;
  promoLabel: string;
} {
  const productA = MOCK_PRODUCTS[(tick + seed) % MOCK_PRODUCTS.length];
  const productB = MOCK_PRODUCTS[(tick + seed + 3) % MOCK_PRODUCTS.length];
  const shop = MOCK_SHOPS.find((s) => s.id === productA.shop_id) || MOCK_SHOPS[0];
  const zone = CAMEROON_ZONES.find((z) => z.id === client.zoneId) || CAMEROON_ZONES[0];

  const qtyA = 1 + ((tick + seed) % 2);
  const qtyB = 1;
  const subtotal = productA.price * qtyA + productB.price * qtyB;

  const methods: PaymentMethod[] = ['mtn', 'orange', 'cash'];
  const paymentMethod = methods[(tick + seed) % methods.length];
  const promos = ['RUSH25', 'BIENVENUE', 'MOMO500', null];
  const candidatePromo = promos[(tick + seed) % promos.length];
  const promoEval = evaluatePromoCode(candidatePromo, subtotal, paymentMethod);

  const deliveryFee = subtotal >= 10000 || promoEval.freeDelivery ? 0 : zone.deliveryFee;
  const discountAmount = promoEval.valid ? promoEval.discountAmount : 0;
  const tipAmount = (tick + seed) % 3 === 0 ? 500 : 0;
  const totalAmount = Math.max(0, subtotal + deliveryFee + tipAmount - discountAmount);

  const orderId = `RSH-GTA-${100 + tick * 10 + seed}`;
  const nowIso = new Date().toISOString();

  const order: Order = {
    id: orderId,
    user_id: client.id,
    shop_id: shop.id,
    courier_id: null,
    status: 'confirmed',
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    delivery_address: `${zone.name}, ${zone.landmark.split('·')[0].trim()} (${zone.cityName})`,
    delivery_phone: '+237678451290',
    courier_name: null,
    courier_phone: '+237 6 77 11 22 33',
    eta_minutes: zone.etaMinutes,
    note: `Commande autonome agent ${client.name}`,
    delivery_zone_id: zone.id,
    promo_code_id: promoEval.valid ? promoEval.promo?.code ?? null : null,
    promo_code: promoEval.valid ? promoEval.promo?.code ?? null : null,
    created_at: nowIso,
    updated_at: nowIso,
    shop_name: shop.name,
    delivery_lat: client.lat,
    delivery_lng: client.lng,
    delivery_city: zone.cityName,
    delivery_zone: zone.name,
    delivery_pin: String(1000 + ((tick * 37 + seed * 13) % 8999)),
    tip_amount: tipAmount,
    scheduled_slot: 'express',
    substitution_pref: 'call',
    payment_method: paymentMethod,
    items: [
      { product_id: productA.id, name: productA.name, qty: qtyA, unit_price: productA.price },
      { product_id: productB.id, name: productB.name, qty: qtyB, unit_price: productB.price },
    ],
    timeline: [
      {
        status: 'confirmed',
        label: 'Commande confirmée',
        note: `Agent ${client.name} (${paymentMethod.toUpperCase()})`,
        at: nowIso,
      },
    ],
  };

  return {
    order,
    promoLabel: promoEval.valid && promoEval.promo ? promoEval.promo.code : 'sans promo',
  };
}

/**
 * Exécute un cycle de simulation autonome multi-agents "GTA".
 */
export function stepGtaSimulation(
  prev: GtaWorldState,
  options: { spawnBatchCount?: number; runChaosCheck?: boolean } = {}
): GtaWorldState {
  const nextTick = prev.tick + 1;
  const nowIso = new Date().toISOString();
  const actors = prev.actors.map((a) => ({ ...a }));
  const orders = prev.orders.map((o) => ({ ...o }));
  const newLogs: GtaFeedLog[] = [];
  const stats = { ...prev.stats };

  const pushLog = (kind: GtaLogKind, actorName: string, message: string, ok = true, orderId?: string) => {
    newLogs.push({
      id: `log-${nextTick}-${newLogs.length}-${Math.random().toString(36).slice(2, 6)}`,
      tick: nextTick,
      kind,
      actorName,
      message,
      ok,
      orderId,
      at: nowIso,
    });
  };

  // 1. Clients autonomes passent de nouvelles commandes
  const idleClients = actors.filter((a) => a.role === 'client' && a.status === 'idle');
  const desiredSpawns = options.spawnBatchCount ?? (idleClients.length > 0 && orders.filter((o) => o.status !== 'delivered').length < 4 ? 1 : 0);

  for (let i = 0; i < Math.min(desiredSpawns, idleClients.length); i++) {
    const client = idleClients[(nextTick + i) % idleClients.length];
    const { order, promoLabel } = makeOrderFromClient(client, nextTick, i + 1);
    orders.unshift(order);
    client.status = 'ordering';
    client.activeOrderId = order.id;
    client.balanceFcfa = Math.max(0, client.balanceFcfa - order.total_amount);
    client.lastAction = `Commande ${order.id} (${order.total_amount.toLocaleString('fr-FR')} F)`;

    stats.totalOrders += 1;
    stats.gmvFcfa += order.total_amount;
    if (order.payment_method === 'mtn' || order.payment_method === 'orange') {
      stats.fapshiSimulatedCount += 1;
      pushLog(
        'FAPSHI',
        client.name,
        `Paiement ${order.payment_method.toUpperCase()} Sandbox initié (${order.total_amount.toLocaleString('fr-FR')} FCFA · ${promoLabel})`,
        true,
        order.id
      );
    } else {
      pushLog(
        'CLIENT',
        client.name,
        `Commande Cash ${order.id} chez ${order.shop_name} (${order.total_amount.toLocaleString('fr-FR')} FCFA · ${promoLabel})`,
        true,
        order.id
      );
    }
  }

  // 2. Commerçants préparent les commandes confirmées
  for (const order of orders) {
    if (order.status === 'confirmed') {
      order.status = 'preparing';
      order.updated_at = nowIso;
      pushLog('BOUTIQUE', order.shop_name || 'Boutique', `Préparation de ${order.id} terminée, prêt pour retrait Rusher.`, true, order.id);
      break;
    }
  }

  // 3. Rushers disponibles prennent les commandes en préparation
  const idleRushers = actors.filter((a) => a.role === 'rusher' && a.status === 'idle');
  for (const order of orders) {
    if (order.status !== 'preparing') continue;
    // Préférer un Rusher de la même ville
    const cityMatch = order.delivery_city === 'Yaoundé' ? 'yaounde' : 'douala';
    const rusher =
      idleRushers.find((r) => r.cityId === cityMatch && r.status === 'idle') ||
      idleRushers.find((r) => r.status === 'idle');
    if (!rusher) break;

    const shop = MOCK_SHOPS.find((s) => s.id === order.shop_id) || MOCK_SHOPS[0];
    order.status = 'out_for_delivery';
    order.courier_id = rusher.id;
    order.courier_name = rusher.name;
    order.updated_at = nowIso;

    rusher.status = 'delivering';
    rusher.activeOrderId = order.id;
    rusher.progress = 0.15;
    rusher.lat = shop.lat ?? rusher.homeLat;
    rusher.lng = shop.lng ?? rusher.homeLng;
    rusher.lastAction = `Retrait ${order.id} → ${order.delivery_zone || order.delivery_city}`;

    const dist = calculateDistanceKm(rusher.lat, rusher.lng, order.delivery_lat ?? 4.05, order.delivery_lng ?? 9.7);
    pushLog('RUSHER', rusher.name, `Course ${order.id} acceptée (${dist} km vers ${order.delivery_address}).`, true, order.id);
  }

  // 4. Progression GPS des Rushers en course
  for (const rusher of actors) {
    if (rusher.role !== 'rusher' || rusher.status !== 'delivering' || !rusher.activeOrderId) continue;
    const order = orders.find((o) => o.id === rusher.activeOrderId);
    if (!order) {
      rusher.status = 'idle';
      rusher.activeOrderId = null;
      continue;
    }

    const shop = MOCK_SHOPS.find((s) => s.id === order.shop_id) || MOCK_SHOPS[0];
    const startLat = shop.lat ?? rusher.homeLat;
    const startLng = shop.lng ?? rusher.homeLng;
    const endLat = order.delivery_lat ?? startLat;
    const endLng = order.delivery_lng ?? startLng;

    const nextProgress = Math.min(1, (rusher.progress ?? 0) + 0.45);
    rusher.progress = nextProgress;
    rusher.lat = Math.round((startLat + (endLat - startLat) * nextProgress) * 100000) / 100000;
    rusher.lng = Math.round((startLng + (endLng - startLng) * nextProgress) * 100000) / 100000;

    if (nextProgress >= 1) {
      order.status = 'delivered';
      order.eta_minutes = 0;
      order.updated_at = nowIso;

      const comm = Math.round(order.subtotal * 0.10) + Math.round(order.delivery_fee * 0.20);
      const rusherGain = Math.round(order.delivery_fee * 0.80) + (order.tip_amount || 0);
      stats.deliveredCount += 1;
      stats.platformCommissionsFcfa += comm;
      stats.rusherEarningsFcfa += rusherGain;

      rusher.status = 'idle';
      rusher.activeOrderId = null;
      rusher.progress = 0;
      rusher.balanceFcfa += rusherGain;
      rusher.missionsCompleted += 1;
      rusher.lastAction = `Livré ${order.id} (+${rusherGain} F)`;

      const client = actors.find((a) => a.id === order.user_id);
      if (client) {
        client.status = 'idle';
        client.activeOrderId = null;
        client.missionsCompleted += 1;
        client.lastAction = `Colis ${order.id} reçu (PIN ${order.delivery_pin})`;
      }

      pushLog(
        'RUSHER',
        rusher.name,
        `Livraison ${order.id} remise avec PIN ${order.delivery_pin} (+${rusherGain.toLocaleString('fr-FR')} FCFA · comm RUSH ${comm} F).`,
        true,
        order.id
      );
    } else {
      const remainingMin = Math.max(2, Math.round((order.eta_minutes || 20) * (1 - nextProgress)));
      order.eta_minutes = remainingMin;
      rusher.lastAction = `En route ${order.id} (${Math.round(nextProgress * 100)}% · ~${remainingMin} min)`;
    }
  }

  // 5. Agent Chaos / Audit Sécurité (tous les 2 ticks ou sur demande)
  if (options.runChaosCheck || nextTick % 2 === 0) {
    const chaosAgent = actors.find((a) => a.role === 'chaos');
    const scenarios = [
      () => {
        // Tentative de fraude sur le prix client (100 F au lieu de 1 500 F)
        const realPrice = MOCK_PRODUCTS[0].price;
        const forgedUnit = 100;
        const blocked = realPrice !== forgedUnit;
        return {
          ok: blocked,
          msg: `Falsification prix panier (${forgedUnit} F) → BLOQUÉE : recalcul serveur imposé à ${realPrice.toLocaleString('fr-FR')} FCFA.`,
        };
      },
      () => {
        // Tentative d'utiliser MOMO500 avec Orange Money
        const evalRes = evaluatePromoCode('MOMO500', 8000, 'orange');
        return {
          ok: !evalRes.valid,
          msg: `Promo MOMO500 forcée sur Orange Money → BLOQUÉE (${evalRes.reason}).`,
        };
      },
      () => {
        // Tentative de pourboire abusif (99 999 FCFA) -> plafonné à 5 000 FCFA
        const clamped = Math.max(0, Math.min(5000, 99999));
        return {
          ok: clamped === 5000,
          msg: `Pourboire hors bornes (99 999 F) → PLAFONNÉ serveur à ${clamped.toLocaleString('fr-FR')} FCFA.`,
        };
      },
      () => {
        // Vérification couverture Cameroun
        const ok = CAMEROON_ZONES.length >= 20;
        return {
          ok,
          msg: `Sonde géo-tarifaire Cameroun : ${CAMEROON_ZONES.length} zones actives validées.`,
        };
      },
    ];
    const check = scenarios[nextTick % scenarios.length]();
    stats.chaosTotalCount += 1;
    if (check.ok) stats.chaosBlockedCount += 1;
    if (chaosAgent) {
      chaosAgent.missionsCompleted += 1;
      chaosAgent.lastAction = check.msg;
    }
    pushLog('CHAOS', 'Inspecteur Chaos', check.msg, check.ok);
  }

  return {
    tick: nextTick,
    actors,
    orders: orders.slice(0, 25),
    logs: [...newLogs, ...prev.logs].slice(0, 60),
    stats,
  };
}
