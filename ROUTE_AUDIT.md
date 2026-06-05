# RUSH — Route Audit System

Ce document contient l'audit complet du système de routage de l'application Next.js RUSH, réalisé le 5 juin 2026.

## Tableau d'audit des routes

| Route | Existe | Fichier Next.js associé | Liens entrants | Liens sortants | Données utilisées | Statut initial | Correction nécessaire |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| `/` | **Oui** | `app/page.tsx` | Header, Footer, Retour depuis `/products/[id]` | `/categories`, `/account`, `/cart`, `/products/[id]` | `MOCK_PRODUCTS`, `MOCK_SHOPS`, `MOCK_CATEGORIES` | OK | Aucune. |
| `/categories` | **Oui** | `app/categories/page.tsx` | Header, Footer, `/cart` (retour), `/checkout` (retour), `/products/[id]` (retour) | `/products/[id]`, `/cart` | `MOCK_PRODUCTS`, `MOCK_CATEGORIES` | OK | Aucune. |
| `/categories/[slug]` | **Oui** | `app/categories/[slug]/page.tsx` | `/categories` | `/products/[id]` | `MOCK_PRODUCTS` | OK | Aucune. |
| `/products/[id]` | **Oui** | `app/products/[id]/page.tsx` | `/`, `/categories`, `/categories/[slug]`, `/products/[id]` | `/cart`, `/categories`, `/products/[id]` | `MOCK_PRODUCTS` | **BROKEN** | Les routes pointaient sur `%5Bid%5D` (qui provoquait des 404). Gérer proprement le cas de produit inexistant (`ProductNotFound`). |
| `/cart` | **Oui** | `app/cart/page.tsx` | Header, Footer, `/products/[id]` | `/checkout`, `/categories` | Context panier | OK | Aucune. |
| `/checkout` | **Oui** | `app/checkout/page.tsx` | `/cart` | `/orders/[reference]` | Context panier, Simulation commande | OK | S'assurer que le bouton de confirmation crée ou simule correctement la commande et redirige vers `/orders/RSH-20492` ou similaire. |
| `/orders` | **Oui** | `app/orders/page.tsx` | Footer, `/account` | `/orders/[reference]`, `/` | `MOCK_ORDERS` | OK | S'assurer que les liens pointent correctement vers `/orders/[reference]`. |
| `/orders/[reference]` | **Oui** | `app/orders/[reference]/page.tsx` | `/orders`, `/checkout` (redirection) | `/orders`, `/` | `MOCK_ORDERS`, Supabase `orders` | **BROKEN** | Les routes pointaient sur `%5Bid%5D` (qui provoquait des 404). Gérer proprement le cas de commande inexistante (`OrderNotFound`). Ajouter le détail des articles commandés, paiement, et boutons d'action. |
| `/promos` | **Non** | `app/promos/page.tsx` (à créer) | Aucun | `/` | Codes promos mockés | **TODO** | Créer la page promos sous forme de placeholder premium pour éviter toute 404. |
| `/merchant` | **Oui** | `app/merchant/page.tsx` | Footer | `/` | Espaces commerçants | OK | Placeholder fonctionnel présent. |
| `/courier` | **Oui** | `app/courier/page.tsx` | Footer | `/` | Espaces livreurs | OK | Placeholder fonctionnel présent. |
| `/admin` | **Oui** | `app/admin/page.tsx` | Header, Footer | `/` | Dashboard admin | OK | Protégé par middleware. Redirige vers `/account` si non connecté et `/` si non admin. |
| `/account` | **Oui** | `app/account/page.tsx` | Header, `/admin` (redirection) | `/orders`, `/` | Profil simulé | OK | Aucune. |
| `/login` | **Non** | Aucun (intégré à `/account`) | Aucun | | | OK | L'auth est simulée ou gérée directement dans `/account`. Pas de liens vers cette route séparée. |
| `/register` | **Non** | Aucun (intégré à `/account`) | Aucun | | | OK | L'auth est simulée ou gérée directement dans `/account`. Pas de liens vers cette route séparée. |

## Matrice des tests manuels obligatoires (Tâche 11)

| Route | Résultat | Correction | Statut final |
| :--- | :--- | :--- | :---: |
| `/` | Page chargée, hero V3 fonctionnel, MoMo badges OK | - | OK |
| `/categories` | Catégories listées, produits chargés par catégories | - | OK |
| `/products/p1` | Page produit de "Bananes plantain mûres" chargée | - | OK |
| `/products/p2` | Page produit de "Tomates fraîches" chargée | - | OK |
| `/products/unknown` | Message "Produit introuvable" et bouton de retour | Géré via template custom | FIXED |
| `/orders` | En-tête riche, commandes triées, bouton suivre OK | - | OK |
| `/orders/RSH-20492` | Page de suivi active chargée, livreur OK, articles OK | - | OK |
| `/orders/RSH-20377` | Historique de commande livrée chargée | - | OK |
| `/orders/unknown` | Message "Commande introuvable" et bouton retour | Géré via template custom | FIXED |
| `/cart` | Panier complet, totaux calculés, redirection checkout | - | OK |
| `/checkout` | Choix paiement MTN/Orange/Cash, validation OK | Redirection vers référence order | FIXED |
| `/promos` | Page de promotions créée avec codes copiables | Créée (évite 404 brute) | FIXED |
| `/merchant` | Page commerçant de simulation chargée | - | PLACEHOLDER CLEAN |
| `/courier` | Page livreur de simulation chargée | - | PLACEHOLDER CLEAN |
| `/admin` | Dashboard d'administration chargé, middleware OK | - | OK |

