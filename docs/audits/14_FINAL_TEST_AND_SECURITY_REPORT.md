# RUSH (v3.2.0) — Rapport Final de Tests Multi-Agents, Déploiement & Audit d'Intrusion / Sécurité

**Date :** 22 novembre 2026  
**Projet :** RUSH — Livraison Ultra-Rapide au Cameroun (`rush-app`)  
**URL Production Vercel :** `https://rush-app-two.vercel.app`  
**Commit déployé :** `710f92c` (`main`)  
**Verdict global :**
- **Prêt à partager pour tests utilisateurs / bêta UX & parcours :** **OUI (Validé en production)**
- **Prêt pour transactions financières réelles à haut volume sans durcissement SQL/Webhook supplémentaire :** **NON (5 correctifs sécurité critiques/élevés listés en Section 4 à appliquer avant ouverture Fapshi Live)**

---

## 1. Synthèse Exécutive des Tests Automatisés & Multi-Agents

| Suite / Environnement | Cible | Résultat | Couverture vérifiée |
| :--- | :--- | :---: | :--- |
| **Lint Statique (`eslint`)** | Codebase TypeScript / React 19 | **PASS (0 erreur)** | Immutabilité hooks, imports, conventions Next.js 16 |
| **Typecheck (`tsc --noEmit`)** | 31 routes + contextes + actions | **PASS (0 erreur)** | Typage strict bout-en-bout (`Order`, `PlaceOrderResult`, Supabase Realtime) |
| **Tests Unitaires & Métier (`bun test`)** | `tests/business.test.ts` + `tests/gta-simulation.test.ts` | **22 / 22 PASS (154 assertions)** | Recalcul serveur des prix, triggers SQL marchand/livreur, commissions 10%/20%, promos, géo-tarification 10 régions, 10 checkouts concurrents Fapshi Sandbox, HMAC Webhook |
| **Build Production (`next build`)** | Next.js 16.2.6 (Turbopack) | **PASS (31 routes)** | Pages statiques & dynamiques (`/`, `/categories`, `/shops/[id]`, `/cart`, `/checkout`, `/orders/[reference]`, `/carte`, `/simulation`, `/admin`, `/api/*`) |
| **Agent Navigateur 1 — Parcours Acheteur E2E** | `http://localhost:3000` | **PASS** | Ajout panier → `/cart` (code `RUSH25` -25%) → `/checkout` (recherche `Rond-point Deido` + Cash) → redirection auto `/orders/RSH-54593` (PIN `3252`, carte OpenStreetMap) |
| **Agent Navigateur 2 — Arène IA « GTA »** | `http://localhost:3000/simulation` | **PASS** | 9 acteurs autonomes (4 Clients, 4 Rushers Moto, 1 Inspecteur Chaos), 32 commandes générées, 295 900 FCFA GMV, 15/15 attaques Chaos bloquées, Audit Serveur 4/4 OK |
| **Agent Navigateur 3 — Production Vercel** | `https://rush-app-two.vercel.app` | **PASS (HTTP 200)** | `/`, `/api/health` (`v3.2.0`), `/simulation` (17 commandes live, carte OSM Cameroun) et `POST /api/simulation/audit` (**4/4 tests serveur validés en ligne**) |

---

## 2. Détail des Contrôles Fonctionnels & Métier Validés

### 2.1 Tarification, Panier, Promos & Checkout (`app/actions/checkout.ts`, `lib/promos.ts`)
- **Anti-falsification des prix panier** : un client qui modifie le prix unitaire dans son navigateur (`50 FCFA` ou `100 FCFA` au lieu de `1 500 FCFA` / `6 500 FCFA`) est systématiquement corrigé par recalcul serveur sur catalogue de référence.
- **Moteur de codes promos unifié** :
  - `RUSH25` : `-25%` sans minimum.
  - `BIENVENUE` : livraison gratuite dès `3 000 FCFA` (rejeté sous `3 000 FCFA`).
  - `MOMO500` : `-500 FCFA` dès `5 000 FCFA` **exclusivement sur MTN MoMo** (rejeté si `Orange Money` ou `Cash`).
  - `ORANGEDG` : `-1 000 FCFA` dès `15 000 FCFA`.
- **Tarification géographique Cameroun (`lib/cameroon-geo.ts`)** :
  - Couverture vérifiée sur **10 régions**, **12 villes** et **23 zones/quartiers** (Douala : Akwa `500 F`, Deido `600 F`, Bonapriso `600 F`, Makepe `700 F`, Bonamoussadi `800 F`, Bonabéri `1 000 F`, Yassa `1 100 F` ; Yaoundé : Centre/Bastos `600 F`, Essos `700 F`, Biyem-Assi `750 F`, Odza `950 F`).
  - Livraison gratuite automatique dès `10 000 FCFA` de sous-total.
- **Plafonnement du pourboire Rusher** : tout pourboire négatif ou excessif (ex. `25 000 FCFA` ou `99 999 FCFA`) est borné côté serveur entre `0` et `5 000 FCFA` et reversé à **100 % au livreur** (0 % commission plateforme sur le pourboire).
- **Équilibre comptable des commissions** :
  - Commission RUSH = `10%` du sous-total produits + `20%` des frais de livraison.
  - Payout Commerçant = `90%` du sous-total produits.
  - Payout Livreur = `80%` des frais de livraison + `100%` du pourboire.

### 2.2 Intégration Paiement Fapshi (`lib/fapshi.ts`, `app/api/webhooks/fapshi/route.ts`)
- Alignement sur les endpoints officiels Fapshi : `POST /initiate-pay` et `GET /payment-status/{transId}` avec entêtes `apiuser` et `apikey`.
- Prise en charge des statuts majuscules/minuscules Fapshi (`SUCCESSFUL`, `FAILED`, `EXPIRED`).
- Mode `simulate` actif sur les agents IA et sur Vercel tant que les clés Fapshi ne sont pas injectées sur Vercel (`integrations.fapshi: false`), garantissant **zéro débit réel accidentel** pendant les tests utilisateurs.

---

## 3. Audit de Sécurité & Tests d'Intrusion (Red-Team / Pentest Codebase)

### 3.1 Ce qui est DÉJÀ protégé et bloqué (Défenses actives)

| Vecteur d'attaque testé | Composant | Statut | Preuve / Mécanisme |
| :--- | :--- | :---: | :--- |
| **Manipulation du prix ou de la remise dans le panier (`localStorage` / payload client)** | `app/actions/checkout.ts` | **BLOQUÉ** | Le serveur ignore `item.unit` envoyé par le client et recalcule `subtotal`, `deliveryFee` et `discountAmount` à partir de `product.price` + `variant.price_delta` + `evaluatePromoCode()`. |
| **Overflow / Montant négatif sur le pourboire (`tipAmount`)** | `app/actions/checkout.ts` | **BLOQUÉ** | `Math.max(0, Math.min(5000, Math.round(Number(tipAmount) || 0)))` empêche d'injecter un pourboire négatif pour réduire sa facture. |
| **XSS (Cross-Site Scripting) via les marqueurs de carte ou la recherche d'adresse** | `components/maps/cameroon-map.tsx` | **BLOQUÉ** | Tous les titres, sous-titres et badges injectés dans les popups/icônes Leaflet passent par `escapeHtml()` (`&`, `<`, `>`, `"`, `'`). |
| **XSS via `dangerouslySetInnerHTML` dans les icônes SVG** | `components/shared/icon.tsx` | **BLOQUÉ** | `ICON_PATHS[name]` est un dictionnaire statique en lecture seule ; aucune entrée utilisateur n'est interprétée en HTML. |
| **Contournement de code promo opérateur (`MOMO500` sur Orange/Cash)** | `lib/promos.ts` | **BLOQUÉ** | `evaluatePromoCode()` vérifie `promo.requiredPaymentMethod === paymentMethod` côté client ET côté serveur dans `placeOrder()`. |
| **Publication produit par un commerçant non abonné** | `supabase/migrations/20260602000000_hardening.sql` | **BLOQUÉ** | Trigger PostgreSQL `check_vendor_product_activation` lève une exception si `not public.is_vendor_active(owner_uid)`. |
| **Assignation d'une course à un livreur non vérifié (CNI/Casier non approuvés)** | `supabase/migrations/20260602000000_hardening.sql` | **BLOQUÉ** | Triggers `check_courier_delivery_assignment` et `check_courier_order_assignment` bloquent toute assignation si `status <> 'approved'`. |
| **Accès non authentifié à `/admin` en production** | `middleware.ts` | **BLOQUÉ** | Redirection automatique vers `/account` si non connecté (même si les variables Supabase manquent sur Vercel) et vers `/` si `profile.role !== 'admin'`. |
| **Fuite de secrets `.env` dans Git / Bundle client** | `.gitignore` & Server Actions | **BLOQUÉ** | `.env*` ignoré par Git ; `FAPSHI_API_KEY`, `FAPSHI_WEBHOOK_SECRET` et `SUPABASE_SERVICE_ROLE_KEY` n'ont pas le préfixe `NEXT_PUBLIC_` et restent côté serveur. |

---

### 3.2 Failles & Risques d'Intrusion Restants (À corriger avant ouverture Fapshi Live / Argent Réel)

> **Confiance de l'audit : High** (vérifié ligne par ligne dans `supabase/schema.sql`, `app/api/webhooks/fapshi/route.ts` et `app/actions/*`).

#### 🚨 Critique 1 — Escalade de privilèges (`role = 'admin'`) via la politique RLS `profiles`
- **Localisation** : `supabase/schema.sql` (lignes 276–278) :
  ```sql
  create policy "Chaque utilisateur peut modifier son profil"
    on public.profiles for update to authenticated
    using (auth.uid() = id) with check (auth.uid() = id);
  ```
- **Scénario d'intrusion** : Un utilisateur connecté qui ouvre la console DevTools de son navigateur peut appeler directement l'API Supabase REST avec la clé publique `NEXT_PUBLIC_SUPABASE_ANON_KEY` :
  `supabase.from('profiles').update({ role: 'admin', courier_verification: 'verified' }).eq('id', myUserId)`
  Comme la politique RLS vérifie uniquement `auth.uid() = id` sans bloquer la colonne `role`, l'utilisateur devient `admin` et déverrouille `/admin` ainsi que toutes les politiques RLS admin.
- **Correctif requis avant prod réelle** : Ajouter un trigger PostgreSQL `BEFORE UPDATE ON public.profiles` interdisant toute modification de `NEW.role` et `NEW.courier_verification` sauf si l'appelant est déjà `admin` ou `service_role`.

#### 🚨 Élevé 2 — Webhook Fapshi exécuté avec la clé Anon au lieu de `SUPABASE_SERVICE_ROLE_KEY` + Secret optionnel
- **Localisation** : `app/api/webhooks/fapshi/route.ts` (lignes 17 et 44).
- **Scénario d'intrusion / blocage** :
  1. Si `FAPSHI_WEBHOOK_SECRET` n'est pas renseigné dans Vercel (chaîne vide), la vérification HMAC-SHA256 est ignorée : un attaquant externe peut envoyer un faux `POST /api/webhooks/fapshi` avec `{"externalId":"RSH-12345","status":"SUCCESSFUL","transId":"FAKE"}` pour marquer une commande ou un abonnement `SUB-...` comme payé sans payer.
  2. Le webhook instancie `createClient()` (clé `ANON` sans cookie utilisateur, donc `auth.uid() = null`). Avec RLS activé sur `orders`, `payments` et `vendor_subscriptions`, Supabase rejettera les `UPDATE` du webhook en production tant que le webhook n'utilise pas un client `service_role` (`SUPABASE_SERVICE_ROLE_KEY`).
  3. La comparaison `digest !== signature` doit utiliser `crypto.timingSafeEqual` pour éviter les attaques temporelles (timing attacks).

#### ⚠️ Élevé 3 — Écriture directe dans `public.orders` via l'API Supabase Client (Contournement de `placeOrder`)
- **Localisation** : `supabase/schema.sql` (lignes 330–340).
- **Scénario d'intrusion** : Même si la Server Action `placeOrder` recalcule les prix, la politique RLS `"Les clients peuvent créer des commandes"` autorise un client authentifié à faire un `INSERT` direct dans `public.orders` depuis le navigateur avec `total_amount = 0`. De même, la politique `"Les livreurs ou vendeurs peuvent mettre à jour les commandes"` n'interdit pas de modifier `total_amount` ou `vendor_payout`.
- **Correctif requis** : Restreindre l'insertion dans `orders` / `order_items` au `service_role` (via la Server Action `placeOrder`) ou vérifier les montants via un trigger SQL.

#### ⚠️ Moyen 4 — IDOR sur `createSubscriptionPayment(vendorId)` et `mergeGuestCart(sessionId, userId)`
- **Localisation** : `app/actions/subscription.ts` (ligne 15) et `app/actions/cart.ts` (ligne 85).
- **Scénario d'intrusion** : Ces deux Server Actions acceptent `vendorId` / `userId` en paramètre client au lieu d'extraire l'utilisateur authentifié depuis `supabase.auth.getUser()` côté serveur.

#### ⚠️ Moyen 5 — Entropie des références `RSH-xxxxx`, Rate-Limiting & Headers HTTP
- **Localisation** : `app/actions/checkout.ts` (`RSH-${Math.floor(Math.random() * 90000 + 10000)}`) et `next.config.ts`.
- **Impact** :
  - Espace de 90 000 identifiants (`RSH-10000` à `RSH-99999`), prédictible si une route de suivi publique non authentifiée est exposée. Passer à `RSH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`.
  - Ajouter un rate-limiter (ex. Upstash Redis ou middleware IP) sur `/api/webhooks/fapshi`, `/api/simulation/audit` et `placeOrder`.
  - Ajouter les headers de sécurité HTTP dans `next.config.ts` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).

---

## 4. Guide de Partage pour tes Testeurs (Bêta actuelle)

Tu peux partager ces liens dès maintenant pour des tests fonctionnels et UX (aucun argent réel n'est débité sur Vercel) :

1. **Application Client RUSH** : `https://rush-app-two.vercel.app`
2. **Catalogue & Filtres multicritères** : `https://rush-app-two.vercel.app/categories`
3. **Carte interactive 10 Régions du Cameroun** : `https://rush-app-two.vercel.app/carte`
4. **Arène Agents IA « Mode GTA » (Simulation live)** : `https://rush-app-two.vercel.app/simulation`
5. **Healthcheck API Production** : `https://rush-app-two.vercel.app/api/health`
