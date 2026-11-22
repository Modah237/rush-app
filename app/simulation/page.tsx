'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/shared/icon';
import CameroonMap, { MapMarker, MapRoute } from '@/components/maps/cameroon-map';
import {
  GtaLogKind,
  GtaWorldState,
  createInitialGtaWorld,
  stepGtaSimulation,
} from '@/lib/gta-agents';
import { MOCK_SHOPS } from '@/lib/mock-data';
import { useRushStore } from '@/context/rush-store-context';
import { syncGtaOrderToDatabase } from '@/app/actions/checkout';
import { formatPrice } from '@/lib/utils';
import { orderPath } from '@/lib/routes';

interface ServerAuditResult {
  agent: string;
  check: string;
  passed: boolean;
  detail: string;
}

export default function GtaSimulationPage() {
  const { addLocalOrder, updateOrderStatus, pushToast } = useRushStore();
  const [world, setWorld] = useState<GtaWorldState>(() => createInitialGtaWorld());
  const [isRunning, setIsRunning] = useState(true);
  const [speedMs, setSpeedMs] = useState(1800);
  const [logFilter, setLogFilter] = useState<GtaLogKind | 'ALL'>('ALL');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<{
    ok: boolean;
    passedCount: number;
    totalCount: number;
    fapshiApiUrlConfigured: string;
    fapshiCredentialsPresent: boolean;
    results: ServerAuditResult[];
  } | null>(null);

  // Sync les nouvelles commandes GTA dans RushStore ET dans Supabase PostgreSQL
  const syncedOrdersRef = React.useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const prevMap = syncedOrdersRef.current;
    world.orders.forEach((o) => {
      const prevStatus = prevMap.get(o.id);
      if (!prevStatus) {
        prevMap.set(o.id, o.status);
        addLocalOrder(o);
        syncGtaOrderToDatabase(o).catch(() => {});
      } else if (prevStatus !== o.status) {
        prevMap.set(o.id, o.status);
        updateOrderStatus(o.id, o.status);
        syncGtaOrderToDatabase(o).catch(() => {});
      }
    });
  }, [world.orders, addLocalOrder, updateOrderStatus]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setWorld((prev) => stepGtaSimulation(prev));
    }, speedMs);
    return () => clearInterval(timer);
  }, [isRunning, speedMs]);

  const handleManualStep = (batchCount?: number, runChaos?: boolean) => {
    setWorld((prev) => stepGtaSimulation(prev, { spawnBatchCount: batchCount, runChaosCheck: runChaos }));
  };

  const handleReset = () => {
    setIsRunning(false);
    setWorld(createInitialGtaWorld());
    pushToast('Arène GTA réinitialisée', 'info');
  };

  const handleRunServerAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/simulation/audit', { method: 'POST' });
      const data = await res.json();
      setAuditReport(data);
      pushToast(
        `Audit Agents Serveur : ${data.passedCount}/${data.totalCount} tests validés`,
        data.ok ? 'success' : 'warning'
      );
    } catch {
      pushToast("Impossible d'exécuter l'audit serveur", 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  const markers: MapMarker[] = useMemo(() => {
    const list: MapMarker[] = [];

    MOCK_SHOPS.forEach((s) => {
      if (typeof s.lat === 'number' && typeof s.lng === 'number') {
        list.push({
          id: `gta-shop-${s.id}`,
          lat: s.lat,
          lng: s.lng,
          title: s.name,
          subtitle: `${s.category} · ${s.quarter}`,
          badge: 'Boutique',
          variant: 'shop',
        });
      }
    });

    world.actors.forEach((a) => {
      if (a.role === 'client') {
        list.push({
          id: `gta-${a.id}`,
          lat: a.lat,
          lng: a.lng,
          title: `${a.name} (Client IA)`,
          subtitle: a.lastAction,
          badge: a.status === 'ordering' ? 'En attente' : 'Client',
          variant: 'customer',
          pulse: a.status === 'ordering',
        });
      } else if (a.role === 'rusher') {
        list.push({
          id: `gta-${a.id}`,
          lat: a.lat,
          lng: a.lng,
          title: `${a.name} (${a.vehicle || 'Rusher'})`,
          subtitle: a.lastAction,
          badge: a.status === 'delivering' ? 'En course' : 'Patrouille',
          variant: 'rider',
          pulse: a.status === 'delivering',
        });
      }
    });

    return list;
  }, [world.actors]);

  const routes: MapRoute[] = useMemo(() => {
    return world.orders
      .filter((o) => o.status === 'out_for_delivery' && typeof o.delivery_lat === 'number' && typeof o.delivery_lng === 'number')
      .map((o) => {
        const shop = MOCK_SHOPS.find((s) => s.id === o.shop_id) || MOCK_SHOPS[0];
        return {
          id: `gta-route-${o.id}`,
          points: [
            [shop.lat ?? 4.0548, shop.lng ?? 9.7012],
            [o.delivery_lat!, o.delivery_lng!],
          ],
          color: '#F50012',
          dashed: true,
          weight: 3.5,
        };
      });
  }, [world.orders]);

  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return world.logs;
    return world.logs.filter((l) => l.kind === logFilter);
  }, [world.logs, logFilter]);

  const logBadgeColor: Record<GtaLogKind, string> = {
    CLIENT: 'bg-brand-tint text-brand',
    RUSHER: 'bg-green-tint text-success',
    BOUTIQUE: 'bg-amber-tint text-warning',
    FAPSHI: 'bg-info/10 text-info',
    CHAOS: 'bg-ink text-white',
  };

  return (
    <div className="page-enter flex flex-col gap-6 px-4 md:px-0 mt-5 pb-20">
      {/* Header Arène GTA */}
      <div className="bg-gradient-to-br from-[#140E0D] via-[#1E1413] to-[#2B1215] text-white rounded-[24px] p-6 shadow-warm-3 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-brand px-3 py-1 text-[10.5px] font-black uppercase tracking-wider text-white shadow-brand">
              <span className={`w-2 h-2 rounded-full bg-white ${isRunning ? 'animate-ping' : ''}`} />
              Environnement Test · Agents IA GTA
            </span>
            <span className="rounded-pill bg-white/10 px-3 py-1 text-[10.5px] font-bold text-white/85">
              Tick #{world.tick}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            RUSH Sandbox City — Simulation Multi-Agents Cameroun
          </h1>
          <p className="text-[13.5px] font-semibold text-white/75 max-w-2xl">
            Des agents IA autonomes (Clients, Boutiques, Rushers moto, Paiement Fapshi Sandbox et Inspecteur Chaos) vivent, commandent et livrent en direct sur Douala & Yaoundé.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsRunning((v) => !v)}
            className={`h-10 px-4 rounded-pill font-black text-[12.5px] cursor-pointer transition-all ${
              isRunning ? 'bg-amber-500 text-ink hover:bg-amber-400' : 'bg-success text-white hover:opacity-95'
            }`}
          >
            {isRunning ? 'Pause Auto' : 'Lancer Auto'}
          </button>
          <button
            type="button"
            onClick={() => handleManualStep(undefined, false)}
            className="h-10 px-4 rounded-pill bg-white/15 hover:bg-white/25 text-white font-black text-[12.5px] cursor-pointer"
          >
            Tick +1
          </button>
          <button
            type="button"
            onClick={() => handleManualStep(3, false)}
            className="h-10 px-4 rounded-pill bg-brand hover:bg-brand-hover text-white font-black text-[12.5px] shadow-brand cursor-pointer"
          >
            + Vague 3 Commandes
          </button>
          <button
            type="button"
            onClick={handleRunServerAudit}
            disabled={isAuditing}
            className="h-10 px-4 rounded-pill bg-white text-ink font-black text-[12.5px] hover:bg-bg-app-light cursor-pointer disabled:opacity-60"
          >
            {isAuditing ? 'Audit...' : 'Tester API Serveur & Fapshi'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="h-10 px-3.5 rounded-pill border border-white/20 text-white/80 hover:text-white font-bold text-[12px] cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* KPI Simulation (grille compacte 3×2 sur mobile, 6 colonnes sur desktop) */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
        {[
          {
            label: 'Commandes IA',
            value: String(world.stats.totalOrders),
            sub: `${world.stats.deliveredCount} livrées · ${Math.max(0, world.stats.totalOrders - world.stats.deliveredCount)} en cours`,
          },
          {
            label: 'Volume GMV',
            value: formatPrice(world.stats.gmvFcfa),
            sub: 'Commandé + livré',
          },
          {
            label: 'Commissions RUSH',
            value: formatPrice(world.stats.platformCommissionsFcfa),
            sub: `Sur ${world.stats.deliveredCount} livrées`,
          },
          {
            label: 'Gains Rushers',
            value: formatPrice(world.stats.rusherEarningsFcfa),
            sub: '80% livr. + tips',
          },
          {
            label: 'Fapshi Sandbox',
            value: String(world.stats.fapshiSimulatedCount),
            sub: 'MoMo / OM simulés',
          },
          {
            label: 'Défense Chaos',
            value: `${world.stats.chaosBlockedCount}/${world.stats.chaosTotalCount}`,
            sub: 'Attaques bloquées',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card bg-surface p-2.5 md:p-4 rounded-xl border border-border-warm-light shadow-warm-1">
            <div className="text-[9.5px] md:text-[10.5px] font-black uppercase tracking-wider text-ink-muted truncate">{kpi.label}</div>
            <div className="text-[15px] md:text-xl font-black text-ink mt-1 leading-tight truncate">{kpi.value}</div>
            <div className="text-[10px] md:text-[11px] font-semibold text-ink-placeholder mt-0.5 truncate">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Résultat Audit Serveur & Fapshi */}
      {auditReport && (
        <div className="card bg-surface p-5 rounded-2xl border border-border-warm shadow-warm-1 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-black text-base text-ink flex items-center gap-2">
                <Icon name="shield" size={18} className="text-success" />
                Rapport Agents Serveur ({auditReport.passedCount}/{auditReport.totalCount} validés)
              </h2>
              <p className="text-[12px] font-semibold text-ink-muted mt-0.5">
                URL Fapshi configurée : <strong className="text-ink">{auditReport.fapshiApiUrlConfigured}</strong> · Clés API détectées :{' '}
                <strong className={auditReport.fapshiCredentialsPresent ? 'text-success' : 'text-warning'}>
                  {auditReport.fapshiCredentialsPresent ? 'OUI (exécuté en simulation sécurisée)' : 'NON'}
                </strong>
              </p>
            </div>
            <span className={`px-3 py-1 rounded-pill text-[11px] font-black ${auditReport.ok ? 'bg-green-tint text-success' : 'bg-brand-tint text-brand'}`}>
              {auditReport.ok ? 'TOUS LES TESTS SERVEUR OK' : 'ANOMALIE DÉTECTÉE'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {auditReport.results.map((r) => (
              <div key={r.agent} className="p-3 rounded-xl bg-bg-app-light border border-border-warm-light flex items-start gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-none text-white mt-0.5 ${r.passed ? 'bg-success' : 'bg-brand'}`}>
                  <Icon name={r.passed ? 'check' : 'x'} size={13} stroke={3} />
                </span>
                <div className="min-w-0">
                  <div className="font-black text-[13px] text-ink">{r.agent}</div>
                  <div className="text-[12px] font-bold text-ink-light">{r.check}</div>
                  <div className="text-[11px] font-semibold text-ink-muted mt-0.5">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carte Live + Journal GTA */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5 items-start">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-base md:text-lg text-ink">Carte temps réel des agents (Douala & Yaoundé)</h2>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-muted whitespace-nowrap">
              <span className="whitespace-nowrap">Vitesse :</span>
              {[
                { label: '1×', ms: 2000 },
                { label: '2×', ms: 1000 },
                { label: 'Turbo', ms: 550 },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setSpeedMs(s.ms)}
                  className={`px-2.5 py-1 rounded-pill cursor-pointer font-black ${
                    speedMs === s.ms ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <CameroonMap
            center={[4.055, 9.712]}
            zoom={12}
            heightClassName="h-[430px]"
            showCitySwitcher
            showLayerToggle
            markers={markers}
            routes={routes}
            interactiveHint="Les marqueurs verts sont les Rushers moto en déplacement autonome"
          />

          {/* Grille des acteurs actifs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {world.actors.map((a) => (
              <div key={a.id} className="card bg-surface p-3.5 rounded-xl border border-border-warm-light shadow-warm-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[13.5px] text-ink truncate">{a.name}</span>
                    <span
                      className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-pill ${
                        a.role === 'rusher'
                          ? 'bg-green-tint text-success'
                          : a.role === 'chaos'
                            ? 'bg-ink text-white'
                            : 'bg-brand-tint text-brand'
                      }`}
                    >
                      {a.role}
                    </span>
                  </div>
                  <div className="text-[11.5px] font-semibold text-ink-muted truncate mt-1">{a.lastAction}</div>
                </div>
                <div className="text-right flex-none">
                  <div className="text-[11px] font-black text-ink">{a.missionsCompleted} act.</div>
                  <div className="text-[10.5px] font-bold text-ink-placeholder">{a.cityId}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Radio / Journal d'activité GTA */}
        <div className="card bg-surface rounded-2xl border border-border-warm-light shadow-warm-1 p-4 flex flex-col gap-3 h-[680px]">
          <div className="flex items-center justify-between border-b border-border-warm-light pb-2.5">
            <h2 className="font-black text-[15px] text-ink">Radio Live des Agents</h2>
            <span className="text-[11px] font-black text-ink-muted">{filteredLogs.length} événements</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'CLIENT', 'BOUTIQUE', 'RUSHER', 'FAPSHI', 'CHAOS'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setLogFilter(k)}
                className={`px-2.5 py-1 rounded-pill text-[10.5px] font-black cursor-pointer ${
                  logFilter === k ? 'bg-ink text-white' : 'bg-bg-app-light text-ink-light'
                }`}
              >
                {k === 'ALL' ? 'Tout' : k}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-bg-app-light/80 border border-border-warm-light text-[12px]">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-pill text-[9.5px] font-black ${logBadgeColor[log.kind]}`}>
                    {log.kind}
                  </span>
                  <span className="text-[10px] font-bold text-ink-placeholder">Tick #{log.tick}</span>
                </div>
                <div className="font-extrabold text-ink mt-1">{log.actorName}</div>
                <p className="text-[11.5px] font-semibold text-ink-light mt-0.5 leading-snug">{log.message}</p>
                {log.orderId && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = world.orders.find((o) => o.id === log.orderId);
                      if (found) addLocalOrder(found);
                      window.location.assign(orderPath(log.orderId!));
                    }}
                    className="mt-1.5 text-[11px] font-black text-brand hover:underline cursor-pointer"
                  >
                    Ouvrir suivi {log.orderId} →
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border-warm-light flex gap-2">
            <Link
              href="/checkout"
              className="flex-1 h-9 rounded-pill bg-bg-app-light hover:bg-border-warm text-ink font-black text-[11.5px] flex items-center justify-center"
            >
              Checkout
            </Link>
            <Link
              href="/admin"
              className="flex-1 h-9 rounded-pill bg-ink text-white font-black text-[11.5px] flex items-center justify-center hover:bg-brand transition-colors"
            >
              Admin Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
