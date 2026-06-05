# RUSH — 03 Data Model Consistency Audit

Réalisé le 5 juin 2026.

## Structure et Normalisation du Modèle de Données

Ce rapport confirme la structure du modèle de données (local mock et tables de production Supabase) et valide son alignement avec les exigences du MVP.

### 1. Produits (`products`)
* **`products.id` :** Clé primaire. Typage : `uuid` en base de données, `string` en mock local (`p1`, `p2`, etc.).
* **`products.name` :** Nom du produit. Typage : `text` / `string`.
* **`products.price` :** Prix unitaire en FCFA. Typage : `int` / `number`.
* **`products.old_price` :** Ancien prix si promotionnel. Typage : `int` (nullable).
* **`products.image_url` :** URL de l'image principale du produit. Typage : `text`.
* **`products.gallery` :** Tableau d'images supplémentaires. Typage : `text[]` en base de données (`product_images` table), `string[]` en mock local.
* **`products.shop_id` :** Clé étrangère pointant vers `shops.id`. Typage : `uuid` / `string`.
* **Alignement Href :** Toutes les cartes et redirections utilisent `/products/[id]` (ex: `/products/p1`).

### 2. Boutiques (`shops`)
* **`shops.id` :** Clé primaire. Typage : `uuid` / `string` (ex: `s1`, `s2`).
* **`shops.name` :** Nom de l'établissement. Typage : `text`.
* **`shops.cover_image_url` :** Image de couverture de la boutique. Typage : `text`.
* **`shops.owner_id` :** Clé étrangère pointant vers `profiles.id` (le profil du vendeur).

### 3. Catégories (`categories`)
* **`categories.id` :** Clé primaire. Typage : `uuid` / `string`.
* **`categories.slug` :** Identifiant URL lisible (ex: `epicerie`, `boissons`). Typage : `text`.

### 4. Commandes et Suivi (`orders`)
* **`orders.id` :** Clé primaire. Contient directement la référence de commande commerciale lisible (ex: `RSH-20492`, `RSH-20377`). Typage : `text` / `string` (pas de colonne `reference` distincte pour simplifier les requêtes et les jointures de paiement).
* **`orders.status` :** État de la commande. Typage : enum `order_status` (`pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `cancelled`).
* **`orders.items` :** Géré de façon normalisée via la table de jointure un-à-plusieurs `order_items` liée par `order_id` (référence order).
* **Alignement Href :** Toutes les cartes et redirections de suivi de commande utilisent `/orders/[reference]` (ex: `/orders/RSH-20492`).

### 5. Paiements (`payments`)
* **`payments.id` :** Clé primaire. Typage : `uuid` / `string`.
* **`payments.status` :** État du paiement. Typage : enum `payment_status` (`payment_pending`, `paid`, `failed`, `refunded`).

### 6. Livreurs et Candidatures (`couriers`)
* **`courier_applications.user_id` :** Clé primaire / étrangère pointant vers le profil livreur `profiles.id`.
* **`courier_applications.status` :** Statut de validation de la candidature par l'admin. Typage : enum `courier_application_status` (`submitted`, `under_review`, `approved`, `rejected`).

### 7. Abonnements Commerçants (`vendor_subscriptions`)
* **`vendor_subscriptions.status` :** Statut de l'abonnement du commerçant. Typage : enum `subscription_status_type` (`pending`, `active`, `expired`, `cancelled`).

---

## Bilan de cohérence
L'alignement est respecté. Les identifiants de produits (`p1`, `p2`, `p3`) et les références de commandes (`RSH-20492`, `RSH-20377`) correspondent aux routes dynamiques `/products/[id]` et `/orders/[reference]`. La structure relationnelle de la base de données est solide et normalisée (RLS active sur toutes les tables).
