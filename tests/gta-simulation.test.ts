import { describe, test, expect } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createInitialGtaWorld, stepGtaSimulation } from '@/lib/gta-agents';
import { placeOrder } from '@/app/actions/checkout';
import { initiatePayment, verifyPayment } from '@/lib/fapshi';
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { POST as fapshiWebhookPost } from '@/app/api/webhooks/fapshi/route';
import { POST as auditPost } from '@/app/api/simulation/audit/route';

describe('RUSH Multi-Agent GTA & Fapshi Test Suite', () => {
  test('Moteur GTA : 8 ticks autonomes génèrent commandes, déplacements Rushers, livraisons et audits Chaos', () => {
    let world = createInitialGtaWorld();
    expect(world.actors.length).toBeGreaterThanOrEqual(9);

    for (let i = 0; i < 8; i++) {
      world = stepGtaSimulation(world, { spawnBatchCount: i === 0 ? 3 : undefined, runChaosCheck: i === 7 });
    }

    expect(world.tick).toBe(8);
    expect(world.stats.totalOrders).toBeGreaterThanOrEqual(3);
    expect(world.stats.deliveredCount).toBeGreaterThanOrEqual(1);
    expect(world.stats.gmvFcfa).toBeGreaterThan(0);
    expect(world.stats.platformCommissionsFcfa).toBeGreaterThan(0);
    expect(world.stats.rusherEarningsFcfa).toBeGreaterThan(0);
    expect(world.stats.chaosBlockedCount).toBe(world.stats.chaosTotalCount);
  });

  test('Fapshi Sandbox simulatePayment : 10 agents clients concurrents passent commande sans débit live', async () => {
    const prod = MOCK_PRODUCTS[0]; // 1500 FCFA
    const zones = ['dla-akwa', 'dla-deido', 'dla-bonapriso', 'yde-bastos', 'dla-bonamoussadi'];

    const calls = Array.from({ length: 10 }, (_, idx) =>
      placeOrder({
        cart: [
          {
            key: prod.id,
            id: prod.id,
            variant_id: null,
            name: prod.name,
            sub: prod.sub,
            glyph: prod.glyph,
            cat: 'fruits',
            unit: 1, // Tentative prix forgé par chaque agent
            qty: 2,
            optName: null,
          },
        ],
        promoCode: idx % 2 === 0 ? 'RUSH25' : 'BIENVENUE',
        paymentMethod: idx % 2 === 0 ? 'mtn' : 'orange',
        deliveryAddress: `Agent GTA #${idx + 1}`,
        deliveryPhone: '+237678451290',
        deliveryZoneId: zones[idx % zones.length],
        tipAmount: idx % 3 === 0 ? 500 : 0,
        simulatePayment: true,
      })
    );

    const results = await Promise.all(calls);
    for (const res of results) {
      expect(res.success).toBe(true);
      expect(res.orderId).toMatch(/^RSH-\d+$/);
      expect(res.paymentUrl).toContain('simulated_payment=1');
      expect(res.orderSummary?.subtotal).toBe(3000);
    }
  });

  test('Service Fapshi simulate : initiatePayment & verifyPayment retournent un flux sandbox valide', async () => {
    const init = await initiatePayment({
      amount: 5000,
      phone: '+237678451290',
      externalId: 'RSH-99001',
      redirectUrl: 'https://rush.cm/orders/RSH-99001',
      simulate: true,
    });
    expect(init.success).toBe(true);
    expect(init.simulated).toBe(true);
    expect(init.transId).toStartWith('FAP-SIM-');

    const status = await verifyPayment(init.transId!, true);
    expect(status.success).toBe(true);
    expect(status.status).toBe('paid');
  });

  test('Webhook Fapshi : rejette une signature manquante/invalide (401) et valide les champs manquants (400)', async () => {
    const missingReq = new NextRequest('http://localhost:3000/api/webhooks/fapshi', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 5000 }),
    });
    const secret = process.env.FAPSHI_WEBHOOK_SECRET || '';
    const missingRes = await fapshiWebhookPost(missingReq);
    expect(missingRes.status).toBe(secret ? 401 : 400);

    if (secret) {
      const badSigReq = new NextRequest('http://localhost:3000/api/webhooks/fapshi', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-fapshi-signature': 'deadbeef',
        },
        body: JSON.stringify({ externalId: 'RSH-1', status: 'SUCCESSFUL', transId: 'FAP-1', amount: 1000 }),
      });
      const badSigRes = await fapshiWebhookPost(badSigReq);
      expect(badSigRes.status).toBe(401);

      const payload = JSON.stringify({ externalId: 'RSH-UNKNOWN', status: 'SUCCESSFUL', transId: 'FAP-2', amount: 1000 });
      const validSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const okSigReq = new NextRequest('http://localhost:3000/api/webhooks/fapshi', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-fapshi-signature': validSig,
        },
        body: payload,
      });
      const okSigRes = await fapshiWebhookPost(okSigReq);
      expect(okSigRes.status).toBe(200);
    }
  });

  test('Endpoint /api/simulation/audit passe 4/4 vérifications serveur & Fapshi', async () => {
    const res = await auditPost();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.passedCount).toBe(json.totalCount);
  });

  test('Durcissement Anti-Intrusion : Grants SQL, Triggers anti-escalade role, Admin Client & Headers HTTP', () => {
    expect(existsSync('lib/supabase/admin.ts')).toBe(true);

    const schemaSql = readFileSync('supabase/schema.sql', 'utf8');
    expect(schemaSql).toContain('grant usage on schema public to anon, authenticated, service_role;');
    expect(schemaSql).toContain('prevent_profile_privilege_escalation');
    expect(schemaSql).toContain('prevent_order_financial_tampering');
    expect(schemaSql).not.toContain('DO $\n');

    const migrationSql = readFileSync('supabase/migrations/20261122_phase4_maps_telemetry_storage.sql', 'utf8');
    expect(migrationSql).toContain('grant all on all tables in schema public to service_role;');
    expect(migrationSql).toContain('trg_prevent_profile_privilege_escalation');
    expect(migrationSql).toContain('trg_prevent_order_financial_tampering');

    const nextCfg = readFileSync('next.config.ts', 'utf8');
    expect(nextCfg).toContain('X-Frame-Options');
    expect(nextCfg).toContain('X-Content-Type-Options');
  });

  test('Compilateur Géospatial 3D (OSM -> Voxels/Meshes) : Projection Mercator, Bâtiments et Routes déterministes', () => {
    const { compileDouala3D, compileYaounde3D, geoToWorld3D, CITY_ORIGINS } = require('@/lib/geospatial-compiler');

    // 1. Projection cartésienne déterministe
    const origin = CITY_ORIGINS.douala;
    const p1 = geoToWorld3D({ lat: origin.lat, lng: origin.lng }, origin);
    expect(p1.x).toBeCloseTo(0, 1);
    expect(p1.z).toBeCloseTo(0, 1);

    // 2. Compilation de Douala (Akwa / Bd Liberté)
    const doualaScene = compileDouala3D();
    expect(doualaScene.cityId).toBe('douala');
    expect(doualaScene.buildings.length).toBeGreaterThanOrEqual(15);
    expect(doualaScene.roads.length).toBeGreaterThanOrEqual(4);
    expect(doualaScene.trees.length).toBeGreaterThan(0);
    expect(doualaScene.streetLights.length).toBeGreaterThan(0);

    // Vérification présence de repères réels
    const akwaPalace = doualaScene.buildings.find((b: any) => b.name.includes('Akwa Palace'));
    expect(akwaPalace).toBeDefined();
    expect(akwaPalace.category).toBe('landmark');

    // 3. Compilation de Yaoundé (Bastos)
    const yaoundeScene = compileYaounde3D();
    expect(yaoundeScene.cityId).toBe('yaounde');
    expect(yaoundeScene.buildings.length).toBeGreaterThanOrEqual(4);
    expect(yaoundeScene.roads.length).toBeGreaterThanOrEqual(2);
  });
});
