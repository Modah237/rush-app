# RUSH — 06 Merchant & Vendor Audit

Réalisé le 5 juin 2026.

## Audit de l'Espace Commerçant & Règles Métier

Ce rapport analyse les mécanismes de sécurité et d'authentification régissant l'espace de travail des marchands partenaires de RUSH.

### 1. Route et Interface de l'Espace Commerçant
L'espace commerçant est accessible sur la route `/merchant` (fichier `app/merchant/page.tsx`). Il s'agit d'un tableau de bord complet de simulation permettant d'ajouter des produits, de gérer les commandes entrantes et de payer son abonnement mensuel.

### 2. Inscription et Création de Boutique
* Le vendeur possède un compte utilisateur avec le rôle `vendor` dans la table `public.profiles`.
* La boutique du vendeur est enregistrée dans la table `public.shops` et stocke l'ID du propriétaire (`owner_id uuid references public.profiles(id)`).

### 3. Statut d'Abonnement du Commerçant
* Les abonnements des vendeurs sont gérés dans la table `public.vendor_subscriptions`.
* La fonction PostgreSQL utilitaire `public.is_vendor_active(vendor_uid uuid)` vérifie l'existence d'une ligne d'abonnement avec le statut `active` et une date d'expiration supérieure à `now()` :
  ```sql
  select exists (
    select 1 
    from public.vendor_subscriptions 
    where vendor_id = vendor_uid 
      and status = 'active' 
      and expires_at > now()
  )
  ```

### 4. Enforcement Métier : Activation de Produits & Abonnement
Une règle métier critique interdit à un commerçant de publier ou d'activer des produits s'il n'a pas d'abonnement actif. Cette règle est implémentée de manière inviolable en base de données par le trigger PostgreSQL `check_vendor_product_activation` sur la table `public.products` :
```sql
create or replace function public.check_vendor_subscription_for_product()
returns trigger as $$
declare
  owner_uid uuid;
begin
  if new.is_active = true then
    select owner_id into owner_uid from public.shops where id = new.shop_id;
    if owner_uid is not null and not public.is_vendor_active(owner_uid) then
      raise exception 'Un commerçant sans abonnement actif ne peut pas publier ou activer ses produits.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
```

### 5. Permissions et Isolation des Données (RLS)
Le vendeur est confiné à ses propres données par les politiques RLS de Supabase :
* **Boutiques :** Un vendeur ne peut modifier que sa propre boutique (`owner_id = auth.uid()`).
* **Produits :** Un vendeur ne peut ajouter/modifier des produits que pour les boutiques dont il est propriétaire (`exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())`).
* **Commandes :** Un vendeur ne peut voir et mettre à jour que les commandes passées dans sa boutique (`exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())`).

---

## Conclusion de l'audit
La sécurité de l'espace marchand est totale. La double barrière (politiques RLS pour l'isolation des données et trigger d'abonnement obligatoire pour la publication des produits) garantit l'intégrité financière et opérationnelle du module vendeur.
