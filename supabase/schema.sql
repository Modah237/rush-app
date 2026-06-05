-- Activation des extensions nécessaires
create extension if not exists "uuid-ossp";

-- Types Énumérés (créés conditionnellement)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('payment_pending', 'paid', 'failed', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('mtn', 'orange', 'cash');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('client', 'vendor', 'courier', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'courier_verification_status') THEN
    CREATE TYPE courier_verification_status AS ENUM ('pending', 'verified', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_subscription_status') THEN
    CREATE TYPE shop_subscription_status AS ENUM ('none', 'active', 'past_due', 'canceled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
    CREATE TYPE vehicle_type AS ENUM ('moto', 'car', 'other');
  END IF;
END
$$;


-- Table des profils (liée à auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null default 'client',
  full_name text,
  phone text,
  avatar_url text,
  default_address text,
  
  -- Spécifique Livreur
  courier_verification courier_verification_status not null default 'pending',
  id_card_url text,
  address_proof_url text,
  criminal_record_url text,
  vehicle_type vehicle_type default 'moto',
  vehicle_plate text,
  is_available boolean not null default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger pour créer automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.phone,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Table des zones de livraison
create table public.delivery_zones (
  id uuid default gen_random_uuid() primary key,
  name text not null unique, -- ex: "Akwa", "Bonapriso", "Bonamoussadi"
  delivery_fee int not null default 700, -- en FCFA
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des codes promo
create table public.promo_codes (
  id uuid default gen_random_uuid() primary key,
  code text not null unique, -- ex: "RUSH25"
  discount_percent int not null check (discount_percent > 0 and discount_percent <= 100),
  min_order_amount int not null default 0,
  max_uses int not null default 100,
  used_count int not null default 0,
  is_active boolean not null default true,
  expiration_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des boutiques / vendeurs
create table public.shops (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete set null not null,
  name text not null,
  category text not null, -- ex: "Supermarché", "Cuisine camer."
  eta_minutes int not null default 25,
  delivery_fee int not null default 500,
  rating numeric(3,2) default 5.00 check (rating >= 0 and rating <= 5),
  reviews_count int default 0,
  distance text, -- ex: "1,2 km"
  glyph text not null default 'basket',
  tint text not null default '#FFE9EB',
  promo text, -- ex: "Livraison offerte"
  badge text, -- ex: "Populaire"
  is_active boolean not null default true,
  
  -- Abonnement boutique
  subscription_status shop_subscription_status not null default 'none',
  subscription_expires_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des catégories
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  label text not null,
  glyph text not null default 'basket',
  tint text not null default '#FFE9EB',
  ink text not null default '#F50012',
  display_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des produits
create table public.products (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references public.shops(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  sub text, -- ex: "Régime ~1,5 kg"
  price int not null check (price >= 0),
  old_price int check (old_price > price),
  rating numeric(3,2) default 5.00 check (rating >= 0 and rating <= 5),
  sold_count text default '0', -- ex: "1.2k"
  glyph text not null default 'leaf',
  tag text, -- ex: "Frais", "Best-seller"
  stock int not null default 10,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Options / Variantes des produits (Taille, Format, etc.)
create table public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null, -- ex: "Solo", "Duo", "Famille" ou "Standard", "Familial"
  price_delta int not null default 0, -- Différentiel de prix (ex: +1500 FCFA)
  stock int not null default 10,
  is_active boolean not null default true
);

-- Table des images de produits
create table public.product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  display_order int default 0
);

-- Table des paniers (Carts)
create table public.carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  session_id text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint carts_user_or_session check (user_id is not null or session_id is not null)
);

-- Éléments du panier
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (cart_id, product_id, variant_id)
);

-- Table des commandes (Orders)
create table public.orders (
  id text primary key, -- ex: "RSH-20512" (format lisible)
  user_id uuid references public.profiles(id) on delete set null,
  shop_id uuid references public.shops(id) on delete set null,
  courier_id uuid references public.profiles(id) on delete set null,
  status order_status not null default 'pending',
  subtotal int not null check (subtotal >= 0),
  delivery_fee int not null check (delivery_fee >= 0),
  discount_amount int not null default 0 check (discount_amount >= 0),
  total_amount int not null check (total_amount >= 0),
  delivery_address text not null,
  delivery_phone text not null,
  courier_name text,
  courier_phone text,
  eta_minutes int,
  note text,
  delivery_zone_id uuid references public.delivery_zones(id),
  promo_code_id uuid references public.promo_codes(id),
  
  -- Commissions et Revenus de la plateforme
  platform_commission_rate numeric(4,2) default 0.10 not null,
  platform_fee int default 0 not null,
  vendor_payout int default 0 not null,
  courier_payout int default 0 not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Articles de la commande (instantané au moment de l'achat)
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_name text,
  quantity int not null check (quantity > 0),
  unit_price int not null check (unit_price >= 0),
  total_price int not null check (total_price >= 0)
);

-- Table des paiements (Payments)
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  payment_method payment_method not null,
  payment_status payment_status not null default 'payment_pending',
  amount int not null,
  transaction_reference text unique, -- Identifiant de transaction Fapshi ou opérateur
  webhook_payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Historique des statuts de la commande (événements pour le live tracking)
create table public.order_status_events (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  status order_status not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activation de Row Level Security (RLS) sur toutes les tables
alter table public.profiles enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.promo_codes enable row level security;
alter table public.shops enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_events enable row level security;

-- ========================================================
-- POLITIQUES RLS
-- ========================================================

-- Profiles
create policy "Les profils sont visibles par tous les connectés"
  on public.profiles for select to authenticated using (true);
create policy "Chaque utilisateur peut modifier son profil"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Delivery Zones & Categories
create policy "Les zones de livraison sont lisibles par tous"
  on public.delivery_zones for select using (true);
create policy "Les catégories sont lisibles par tous"
  on public.categories for select using (true);

-- Shops & Products & Variants & Images
create policy "Les boutiques sont visibles par tous"
  on public.shops for select using (true);
create policy "Les propriétaires de boutique peuvent modifier leur boutique"
  on public.shops for all to authenticated
  using (owner_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Les produits sont visibles par tous"
  on public.products for select using (true);
create policy "Les vendeurs peuvent gérer les produits de leur boutique"
  on public.products for all to authenticated
  using (
    exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Les variantes de produits sont visibles par tous"
  on public.product_variants for select using (true);
create policy "Les vendeurs peuvent gérer les variantes de leurs produits"
  on public.product_variants for all to authenticated
  using (
    exists (select 1 from public.products p join public.shops s on p.shop_id = s.id where p.id = product_id and s.owner_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Carts
create policy "Les utilisateurs possèdent leur panier"
  on public.carts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Les utilisateurs possèdent les items de leur panier"
  on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts where id = cart_id and user_id = auth.uid()));

-- Orders & Order Items
create policy "Les clients peuvent lire leurs propres commandes"
  on public.orders for select to authenticated
  using (
    user_id = auth.uid() 
    or courier_id = auth.uid() 
    or exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Les clients peuvent créer des commandes"
  on public.orders for insert to authenticated
  with check (user_id = auth.uid());

create policy "Les livreurs ou vendeurs peuvent mettre à jour les commandes"
  on public.orders for update to authenticated
  using (
    courier_id = auth.uid() 
    or exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Les items de commande sont visibles par les parties prenantes"
  on public.order_items for select to authenticated
  using (
    exists (select 1 from public.orders where id = order_id and (
      user_id = auth.uid() 
      or courier_id = auth.uid()
      or exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid())
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    ))
  );

create policy "Insertion des items de commande par le client"
  on public.order_items for insert to authenticated
  with check (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));

-- Payments
create policy "Les clients voient leurs paiements"
  on public.payments for select to authenticated
  using (exists (select 1 from public.orders where id = order_id and user_id = auth.uid()));

-- Order Status Events
create policy "Les jalons de livraison sont visibles par le client"
  on public.order_status_events for select to authenticated
  using (exists (select 1 from public.orders where id = order_id and (user_id = auth.uid() or courier_id = auth.uid() or exists (select 1 from public.shops where id = shop_id and owner_id = auth.uid()))));

create policy "Les livreurs et admins peuvent insérer des jalons de statut"
  on public.order_status_events for insert to authenticated
  with check (
    exists (select 1 from public.orders where id = order_id and (courier_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
  );

-- ========================================================
-- NOUVELLES TABLES & TYPES (HARDENING SPRINT)
-- ========================================================

-- Types Énumérés requis
create type public.subscription_status_type as enum ('pending', 'active', 'expired', 'cancelled');
create type public.courier_application_status as enum ('submitted', 'under_review', 'approved', 'rejected');
create type public.delivery_status as enum ('pending_assignment', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled');

-- Table des Abonnements Commerçants
create table public.vendor_subscriptions (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references public.profiles(id) on delete cascade not null,
  plan_name text not null,
  amount int not null,
  currency text not null default 'FCFA',
  status public.subscription_status_type not null default 'pending',
  starts_at timestamp with time zone not null,
  expires_at timestamp with time zone not null,
  payment_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table des Paiements d'Abonnement
create table public.subscription_payments (
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

-- Ajout de la contrainte foreign key après création
alter table public.vendor_subscriptions 
add constraint fk_vendor_subscription_payment 
foreign key (payment_id) references public.subscription_payments(id) on delete set null;

-- Table de Validation Livreur
create table public.courier_applications (
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

-- Tables de Suivi des Livraisons
create table public.deliveries (
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

create table public.delivery_status_events (
  id uuid default gen_random_uuid() primary key,
  delivery_id uuid references public.deliveries(id) on delete cascade not null,
  status public.delivery_status not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fonctions Utilitaires / Business Logic Helpers
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

-- Triggers PostgreSQL d'Enforcement Métier
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

create trigger check_courier_delivery_assignment
  before insert or update on public.deliveries
  for each row execute procedure public.check_courier_approval_for_assignment();

create trigger check_courier_order_assignment
  before insert or update on public.orders
  for each row execute procedure public.check_courier_approval_for_assignment();

-- Activation de RLS sur les nouvelles tables
alter table public.vendor_subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.courier_applications enable row level security;
alter table public.deliveries enable row level security;
alter table public.delivery_status_events enable row level security;

-- Politiques RLS (Row Level Security)

-- Vendor Subscriptions
create policy "Les commerçants voient leurs propres abonnements"
  on public.vendor_subscriptions for select to authenticated
  using (vendor_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Seul l'admin peut modifier les abonnements"
  on public.vendor_subscriptions for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Subscription Payments
create policy "Les commerçants voient leurs propres paiements d'abonnement"
  on public.subscription_payments for select to authenticated
  using (vendor_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Courier Applications
create policy "Les livreurs voient leur propre candidature"
  on public.courier_applications for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Les livreurs peuvent insérer leur candidature"
  on public.courier_applications for insert to authenticated
  with check (user_id = auth.uid());

create policy "Seul l'admin peut modifier ou valider les candidatures"
  on public.courier_applications for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Deliveries
create policy "Les livreurs et admins voient les livraisons"
  on public.deliveries for select to authenticated
  using (
    courier_id = auth.uid()
    or exists (select 1 from public.orders o join public.shops s on o.shop_id = s.id where o.id = order_id and s.owner_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Les admins peuvent tout faire sur les livraisons"
  on public.deliveries for all to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Delivery Status Events
create policy "Lecture des jalons de livraison"
  on public.delivery_status_events for select to authenticated
  using (
    exists (select 1 from public.deliveries d where d.id = delivery_id and (
      d.courier_id = auth.uid()
      or exists (select 1 from public.orders o join public.shops s on o.shop_id = s.id where o.id = d.order_id and s.owner_id = auth.uid())
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    ))
  );

create policy "Insertion de jalons par le livreur assigné ou admin"
  on public.delivery_status_events for insert to authenticated
  with check (
    exists (select 1 from public.deliveries d where d.id = delivery_id and (d.courier_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')))
  );
