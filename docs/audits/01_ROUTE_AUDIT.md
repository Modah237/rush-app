# RUSH — 01 Route Manifest Audit

Ce document présente l'analyse de chaque route de l'application RUSH, réalisée le 5 juin 2026.

---

### Route : `/`
* **File path :** `app/page.tsx`
* **Exists :** yes
* **Current behavior :** Page d'accueil avec hero V3, carrousels de produits, boutiques populaires et badges MoMo/OM.
* **Incoming links :** Footer, Header, `/products/[id]` (retour)
* **Outgoing links :** `/categories`, `/account`, `/cart`, `/products/[id]`
* **Data source :** Local mock data (`MOCK_PRODUCTS`, `MOCK_SHOPS`)
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/categories`
* **File path :** `app/categories/page.tsx`
* **Exists :** yes
* **Current behavior :** Liste de tous les produits filtrables par onglets de catégories.
* **Incoming links :** Header, Footer, `/cart` (retour), `/checkout` (retour)
* **Outgoing links :** `/products/[id]`, `/cart`
* **Data source :** `MOCK_PRODUCTS` et `MOCK_CATEGORIES`
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/categories/[slug]`
* **File path :** `app/categories/[slug]/page.tsx`
* **Exists :** yes
* **Current behavior :** Affiche les produits d'une catégorie spécifique.
* **Incoming links :** `/categories`, `/`
* **Outgoing links :** `/products/[id]`
* **Data source :** `MOCK_PRODUCTS`
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/products/[id]`
* **File path :** `app/products/[id]/page.tsx`
* **Exists :** yes
* **Current behavior :** Fiche produit détaillée avec galerie d'images, choix des variantes de prix, avis et bouton d'ajout au panier.
* **Incoming links :** `/`, `/categories`, `/categories/[slug]`, `/products/[id]` (produits similaires)
* **Outgoing links :** `/cart`, `/categories`, `/products/[id]`
* **Data source :** `MOCK_PRODUCTS`
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun (le bug de dossier `%5Bid%5D` et l'affichage personnalisé pour produit inexistant ont été corrigés).

---

### Route : `/cart`
* **File path :** `app/cart/page.tsx`
* **Exists :** yes
* **Current behavior :** Récapitulatif du panier client avec modification des quantités, suppression d'articles et bouton vers le checkout.
* **Incoming links :** Header, Footer, `/products/[id]`
* **Outgoing links :** `/checkout`, `/categories` (si panier vide)
* **Data source :** `cart-context`
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/checkout`
* **File path :** `app/checkout/page.tsx`
* **Exists :** yes
* **Current behavior :** Formulaire de livraison, choix de la passerelle de paiement (MTN MoMo, Orange Money, Cash) et validation de la commande.
* **Incoming links :** `/cart`
* **Outgoing links :** `/orders/[reference]` (redirection post-paiement)
* **Data source :** `cart-context`
* **Auth requirement :** Optionnel (simulé)
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/orders`
* **File path :** `app/orders/page.tsx`
* **Exists :** yes
* **Current behavior :** Historique des commandes de l'utilisateur, séparées en onglets "En cours" et "Historique".
* **Incoming links :** Header, Footer, `/account`
* **Outgoing links :** `/orders/[reference]`
* **Data source :** `MOCK_ORDERS` et Supabase `orders`
* **Auth requirement :** Authentifié (ou fallback mocké si non connecté)
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/orders/[reference]`
* **File path :** `app/orders/[reference]/page.tsx`
* **Exists :** yes
* **Current behavior :** Live tracking de la livraison sur carte SVG stylisée avec timeline animée, liste d'articles, détails livreur et boutons d'action.
* **Incoming links :** `/orders`, `/checkout` (redirection)
* **Outgoing links :** `/orders`, `/` (recommander)
* **Data source :** `MOCK_ORDERS` et Supabase `orders` / `order_items`
* **Auth requirement :** Authentifié
* **Status :** OK
* **Fix required :** Aucun (le dossier `%5Breference%5D` a été corrigé sur disque et la page a été enrichie avec les articles et les actions).

---

### Route : `/promos`
* **File path :** `app/promos/page.tsx`
* **Exists :** yes
* **Current behavior :** Liste des codes de réduction et de livraison offerte copiables en un clic.
* **Incoming links :** Footer, Header
* **Outgoing links :** `/`
* **Data source :** Données promotionnelles mockées
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun (la page a été créée au cours de ce sprint).

---

### Route : `/merchant`
* **File path :** `app/merchant/page.tsx`
* **Exists :** yes
* **Current behavior :** Tableau de bord de simulation pour les commerçants (gestion des produits, abonnements, ventes).
* **Incoming links :** Footer
* **Outgoing links :** `/`
* **Data source :** Profil boutique
* **Auth requirement :** Authentifié (rôle vendor)
* **Status :** PLACEHOLDER CLEAN
* **Fix required :** Aucun (bel écran de simulation fonctionnelle).

---

### Route : `/courier`
* **File path :** `app/courier/page.tsx`
* **Exists :** yes
* **Current behavior :** Tableau de bord de simulation pour les livreurs (soumission des pièces d'identité, suivi de livraison).
* **Incoming links :** Footer
* **Outgoing links :** `/`
* **Data source :** Profil livreur
* **Auth requirement :** Authentifié (rôle courier)
* **Status :** PLACEHOLDER CLEAN
* **Fix required :** Aucun (bel écran de simulation fonctionnelle).

---

### Route : `/admin`
* **File path :** `app/admin/page.tsx`
* **Exists :** yes
* **Current behavior :** Supervision globale de la plateforme (validation des boutiques, livreurs et suivi financier).
* **Incoming links :** Footer, Header
* **Outgoing links :** `/`
* **Data source :** Supabase stats
* **Auth requirement :** Authentifié (rôle admin requis via middleware)
* **Status :** OK
* **Fix required :** Aucun (redirection vers `/account` pour connexion si non authentifié et vers `/` si non-admin).

---

### Route : `/account`
* **File path :** `app/account/page.tsx`
* **Exists :** yes
* **Current behavior :** Page profil client affichant les points de fidélité, les favoris et les options d'aide.
* **Incoming links :** Header, `/admin` (redirection)
* **Outgoing links :** `/orders`, `/` (logout)
* **Data source :** Profil simulé
* **Auth requirement :** Aucun
* **Status :** OK
* **Fix required :** Aucun

---

### Route : `/login`
* **File path :** Aucun (géré de manière intégrée au sein de `/account`)
* **Exists :** no
* **Current behavior :** Gérée sous forme de modal d'auth ou directement dans `/account`.
* **Incoming links :** Aucun
* **Outgoing links :** -
* **Data source :** Supabase Auth
* **Auth requirement :** -
* **Status :** OK
* **Fix required :** Aucun (pas de liens cassés vers cette route).

---

### Route : `/register`
* **File path :** Aucun (géré de manière intégrée au sein de `/account`)
* **Exists :** no
* **Current behavior :** Gérée sous forme de modal d'auth ou directement dans `/account`.
* **Incoming links :** Aucun
* **Outgoing links :** -
* **Data source :** Supabase Auth
* **Auth requirement :** -
* **Status :** OK
* **Fix required :** Aucun (pas de liens cassés vers cette route).

---

### Route : `/api/webhooks/fapshi`
* **File path :** `app/api/webhooks/fapshi/route.ts`
* **Exists :** yes
* **Current behavior :** Reçoit les requêtes POST de validation de paiement depuis Fapshi et met à jour Supabase.
* **Incoming links :** Externe (opérateur Fapshi)
* **Outgoing links :** -
* **Data source :** Webhook Payload
* **Auth requirement :** Validation de signature par clé secrète
* **Status :** OK
* **Fix required :** Aucun
