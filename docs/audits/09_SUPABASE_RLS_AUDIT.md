# RUSH — 09 Supabase & RLS Audit

Réalisé le 5 juin 2026.

## Audit de l'Architecture de Base de Données et Sécurité RLS

Ce rapport analyse la structure et les politiques d'accès de sécurité (Row Level Security) implémentées dans Supabase PostgreSQL.

### 1. Structure Générale des Tables
Le schéma de base de données [schema.sql](file:///a:/Virus-Sama-projects/rush-app/supabase/schema.sql) définit 15 tables structurées :
* **Utilisateurs & Profils :** `profiles` (gestion des rôles et livreurs).
* **Zones & Tarifications :** `delivery_zones`, `promo_codes`, `categories`.
* **Marchands & Catalogues :** `shops`, `products`, `product_variants`, `product_images`.
* **Paniers (Carts) :** `carts`, `cart_items`.
* **Ventes & Commandes :** `orders`, `order_items`, `payments`, `order_status_events`.
* **Abonnements & Candidatures (Hardening) :** `vendor_subscriptions`, `subscription_payments`, `courier_applications`, `deliveries`, `delivery_status_events`.

### 2. Row Level Security (RLS)
Toutes les tables ont la sécurité RLS activée via la commande PostgreSQL :
`alter table public.[table_name] enable row level security;`

### 3. Analyse des Politiques d'Accès par Rôle

#### A. Clients
* **Commandes :** Un client ne peut lire que ses propres commandes (`user_id = auth.uid()`) et ne peut insérer que des commandes sous sa propre identité (`with check (user_id = auth.uid())`).
* **Panier :** Chaque client est isolé sur son propre panier (`user_id = auth.uid()`) et ses propres éléments de panier.
* **Paiements :** Un client ne peut voir que les transactions liées à ses commandes.

#### B. Commerçants (Vendors)
* **Boutiques & Produits :** Seul le propriétaire déclaré de la boutique (`owner_id = auth.uid()`) peut allouer, modifier ou supprimer des produits et des variantes de prix.
* **Commandes :** Le vendeur a un accès en lecture et en mise à jour (statut de préparation) pour toutes les commandes passées auprès de sa boutique (`exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())`).

#### C. Livreurs (Couriers)
* **Livraisons :** Un livreur ne peut voir et mettre à jour (statuts de ramassage et de livraison) que les fiches de livraison qui lui sont explicitement attribuées (`courier_id = auth.uid()`).
* **Jalons de Suivi :** Seul le livreur assigné à la livraison ou un administrateur peut insérer des jalons d'état dans `delivery_status_events`.

#### D. Administrateurs (Admins)
* **Accès global :** Toutes les tables intègrent une politique de sécurité vérifiant si l'utilisateur possède le rôle `'admin'` dans son profil, lui octroyant les droits de lecture, d'écriture et de modification sur tout le système.

### 4. Enforcement Métier par Triggers
* **check_vendor_product_activation :** Empêche l'activation/la publication de produits par un vendeur sans abonnement valide.
* **check_courier_delivery_assignment :** Empêche d'attribuer une commande ou livraison à un livreur non approuvé par l'administration.

---

## Conclusion de l'audit
Le modèle de sécurité Supabase et RLS de RUSH est conforme aux règles métier les plus strictes. L'étanchéité entre les données des clients, des différents commerçants et des livreurs est assurée de manière native au niveau du serveur de base de données PostgreSQL.
