-- 1. Modification de la table carts pour supporter le panier visiteur anonyme (idempotent)
alter table public.carts drop constraint if exists carts_user_id_key;
alter table public.carts alter column user_id drop not null;
alter table public.carts add column if not exists session_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'carts_session_id_key' 
      and conrelid = 'public.carts'::regclass
  ) then
    alter table public.carts add constraint carts_session_id_key unique (session_id);
  end if;
end$$;

-- 2. Types Énumérés requis (sécurisés par bloc conditionnel)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status_type') then
    create type public.subscription_status_type as enum ('pending', 'active', 'expired', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'courier_application_status') then
    create type public.courier_application_status as enum ('submitted', 'under_review', 'approved', 'rejected');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum ('pending_assignment', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');
  end if;
end$$;

-- 3. Table des Abonnements Commerçants
create table if not exists public.vendor_subscriptions (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references public.profiles(id) on delete cascade not null,
  plan_name text not null,
  amount int not null,
  currency text not null default 'FCFA',
  status public.subscription_status_type not null default 'pending',
  starts_at timestamp with time zone not null,
  expires_at timestamp with time zone not null,
  payment_id uuid, -- sera lié à la table des paiements d'abonnement
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des Paiements d'Abonnement
create table if not exists public.subscription_payments (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references public.profiles(id) on delete cascade not null,
  subscription_id uuid references public.vendor_subscriptions(id) on delete set null,
  amount int not null,
  currency text not null default 'FCFA',
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'payment_pending',
  transaction_reference text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ajout de la contrainte foreign key après création si elle n'existe pas
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'fk_vendor_subscription_payment' 
      and conrelid = 'public.vendor_subscriptions'::regclass
  ) then
    alter table public.vendor_subscriptions 
    add constraint fk_vendor_subscription_payment 
    foreign key (payment_id) references public.subscription_payments(id) on delete set null;
  end if;
end$$;

-- 4. Table de Validation Livreur
create table if not exists public.courier_applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  identity_document_url text not null,
  proof_of_address_url text not null,
  criminal_record_url text not null,
  vehicle_type public.vehicle_type not null default 'moto',
  vehicle_registration text not null,
  status public.courier_application_status not null default 'submitted',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tables de Suivi des Livraisons
create table if not exists public.deliveries (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null unique,
  courier_id uuid references public.profiles(id) on delete set null,
  status public.delivery_status not null default 'pending_assignment',
  pickup_address text not null,
  dropoff_address text not null,
  delivery_fee int not null default 0,
  courier_payout int not null default 0,
  assigned_at timestamp with time zone,
  picked_up_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.delivery_status_events (
  id uuid default gen_random_uuid() primary key,
  delivery_id uuid references public.deliveries(id) on delete cascade not null,
  status public.delivery_status not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Commissions de la Marketplace sur la table des commandes (sécurisé)
alter table public.orders add column if not exists platform_commission_rate numeric(4,2) default 0.10 not null;
alter table public.orders add column if not exists platform_fee int default 0 not null;
alter table public.orders add column if not exists vendor_payout int default 0 not null;
alter table public.orders add column if not exists courier_payout int default 0 not null;

-- 7. Fonctions Utilitaires / Business Logic Helpers
-- Vérifier si le commerçant a un abonnement actif
create or replace function public.is_vendor_active(vendor_uid uuid)
returns boolean as $$
declare
  is_active boolean;
begin
  select exists (
    select 1 
    from public.vendor_subscriptions 
    where vendor_id = vendor_uid 
      and status = 'active' 
      and expires_at > now()
  ) into is_active;
  return is_active;
end;
$$ language plpgsql security definer;

-- Vérifier si la candidature du livreur est acceptée/approuvée
create or replace function public.is_courier_approved(courier_uid uuid)
returns boolean as $$
declare
  is_approved boolean;
begin
  select exists (
    select 1 
    from public.courier_applications 
    where user_id = courier_uid 
      and status = 'approved'
  ) into is_approved;
  return is_approved;
end;
$$ language plpgsql security definer;

-- 8. Triggers PostgreSQL d'Enforcement Métier (avec suppression préalable pour mise à jour propre)
-- Trigger : Interdire l'activation de produits si le commerçant n'a pas d'abonnement actif
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

drop trigger if exists check_vendor_product_activation on public.products;
create trigger check_vendor_product_activation
  before insert or update on public.products
  for each row execute procedure public.check_vendor_subscription_for_product();

-- Trigger : Interdire l'attribution d'une livraison ou commande à un livreur non approuvé
create or replace function public.check_courier_approval_for_assignment()
returns trigger as $$
begin
  if new.courier_id is not null then
    if not public.is_courier_approved(new.courier_id) then
      raise exception 'Un livreur ne peut recevoir aucune livraison tant que son dossier n’est pas approved.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_courier_delivery_assignment on public.deliveries;
create trigger check_courier_delivery_assignment
  before insert or update on public.deliveries
  for each row execute procedure public.check_courier_approval_for_assignment();

drop trigger if exists check_courier_order_assignment on public.orders;
create trigger check_courier_order_assignment
  before insert or update on public.orders
  for each row execute procedure public.check_courier_approval_for_assignment();

-- 9. Activation de Row Level Security (RLS) sur les nouvelles tables (déjà idempotent)
alter table public.vendor_subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.courier_applications enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_status_events enable row level security;

-- 10. Politiques RLS (Row Level Security - avec suppression pour éviter les doublons/conflits)

-- Vendor Subscriptions
drop policy if exists "Les commerçants voient leurs propres abonnements" on public.vendor_subscriptions;
create policy "Les commerçants voient leurs propres abonnements"
  on public.vendor_subscriptions for select to authenticated
  using (vendor_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Seul l'admin peut modifier les abonnements" on public.vendor_subscriptions;
create policy "Seul l'admin peut modifier les abonnements"
  on public.vendor_subscriptions for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Subscription Payments
drop policy if exists "Les commerçants voient leurs propres paiements d'abonnement" on public.subscription_payments;
create policy "Les commerçants voient leurs propres paiements d'abonnement"
  on public.subscription_payments for select to authenticated
  using (vendor_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Courier Applications
drop policy if exists "Les livreurs voient leur propre candidature" on public.courier_applications;
create policy "Les livreurs voient leur propre candidature"
  on public.courier_applications for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Les livreurs peuvent insérer leur candidature" on public.courier_applications;
create policy "Les livreurs peuvent insérer leur candidature"
  on public.courier_applications for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Seul l'admin peut modifier ou valider les candidatures" on public.courier_applications;
create policy "Seul l'admin peut modifier ou valider les candidatures"
  on public.courier_applications for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Deliveries
drop policy if exists "Les livreurs et admins voient les livraisons" on public.deliveries;
create policy "Les livreurs et admins voient les livraisons"
  on public.deliveries for select to authenticated
  using (
    courier_id = auth.uid()
    or exists (select 1 from public.orders o join public.shops s on o.shop_id = s.id where o.id = order_id and s.owner_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Les admins peuvent tout faire sur les livraisons" on public.deliveries;
create policy "Les admins peuvent tout faire sur les livraisons"
  on public.deliveries for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Delivery Status Events
drop policy if exists "Lecture des jalons de livraison" on public.delivery_status_events;
create policy "Lecture des jalons de livraison"
  on public.delivery_status_events for select to authenticated
  using (
    exists (select 1 from public.deliveries d where d.id = delivery_id and (
      d.courier_id = auth.uid()
      or exists (select 1 from public.orders o join public.shops s on o.shop_id = s.id where o.id = d.order_id and s.owner_id = auth.uid())
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    ))
  );

drop policy if exists "Insertion de jalons par le livreur assigné ou admin" on public.delivery_status_events;
create policy "Insertion de jalons par le livreur assigné ou admin"
  on public.delivery_status_events for insert to authenticated
  with check (
    exists (select 1 from public.deliveries d where d.id = delivery_id and (d.courier_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
  );
