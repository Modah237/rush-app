-- Migration incrémentale Phase 4 RUSH :
-- À exécuter dans Supabase SQL Editor sur une base déjà initialisée (évite l'erreur "relation profiles already exists").

-- 1. Colonnes optionnelles ajoutées sur orders si absentes
alter table if exists public.orders
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision,
  add column if not exists delivery_pin text,
  add column if not exists tip_amount int not null default 0,
  add column if not exists scheduled_slot text default 'express',
  add column if not exists substitution_pref text default 'call';

-- 2. Table de télémétrie GPS temps réel des livreurs
create table if not exists public.courier_locations (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  courier_id uuid references public.profiles(id) on delete cascade not null,
  lat double precision not null,
  lng double precision not null,
  speed_kmh numeric(5,2) default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_courier_locations_order on public.courier_locations(order_id, updated_at desc);

alter table public.courier_locations enable row level security;

drop policy if exists "Le livreur met à jour sa position GPS" on public.courier_locations;
create policy "Le livreur met à jour sa position GPS"
  on public.courier_locations for insert to authenticated
  with check (courier_id = auth.uid());

drop policy if exists "Lecture position GPS par client de la commande, livreur ou admin" on public.courier_locations;
create policy "Lecture position GPS par client de la commande, livreur ou admin"
  on public.courier_locations for select to authenticated
  using (
    courier_id = auth.uid()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Table des abonnements Notifications Push Web
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Chaque utilisateur gère ses abonnements Push" on public.push_subscriptions;
create policy "Chaque utilisateur gère ses abonnements Push"
  on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 4. Buckets Supabase Storage pour justificatifs livreurs & photos produits
insert into storage.buckets (id, name, public)
values ('courier-docs', 'courier-docs', false), ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Upload justificatifs livreurs authentifiés" on storage.objects;
create policy "Upload justificatifs livreurs authentifiés"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'courier-docs');

drop policy if exists "Lecture justificatifs livreurs par propriétaire ou admin" on storage.objects;
create policy "Lecture justificatifs livreurs par propriétaire ou admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'courier-docs' and (auth.uid() = owner or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')));

drop policy if exists "Lecture publique des photos produits" on storage.objects;
create policy "Lecture publique des photos produits"
  on storage.objects for select to public
  using (bucket_id = 'product-images');

drop policy if exists "Upload photos produits commerçants" on storage.objects;
create policy "Upload photos produits commerçants"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

-- 5. Grants PostgREST (RLS reste actif et protège chaque ligne)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;


-- 5. Grants PostgREST (corrige l'erreur 42501 "permission denied for table orders / shops")
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;

-- 6. Trigger anti-escalade de privilèges sur public.profiles
create or replace function public.prevent_profile_privilege_escalation()
returns trigger as $$
declare
  caller_role text;
begin
  caller_role := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
  if caller_role = 'service_role' then
    return new;
  end if;

  if (new.role is distinct from old.role or new.courier_verification is distinct from old.courier_verification) then
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Escalade de privilèges interdite : seul un administrateur peut modifier role ou courier_verification.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_profile_privilege_escalation on public.profiles;
create trigger trg_prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_profile_privilege_escalation();

-- 7. Trigger anti-falsification financière sur public.orders
create or replace function public.prevent_order_financial_tampering()
returns trigger as $$
declare
  caller_role text;
begin
  caller_role := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '');
  if caller_role = 'service_role' then
    return new;
  end if;

  if (
    new.subtotal is distinct from old.subtotal or
    new.delivery_fee is distinct from old.delivery_fee or
    new.discount_amount is distinct from old.discount_amount or
    new.total_amount is distinct from old.total_amount or
    new.platform_fee is distinct from old.platform_fee or
    new.vendor_payout is distinct from old.vendor_payout or
    new.courier_payout is distinct from old.courier_payout
  ) then
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Modification financière interdite sur une commande existante.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_order_financial_tampering on public.orders;
create trigger trg_prevent_order_financial_tampering
  before update on public.orders
  for each row execute procedure public.prevent_order_financial_tampering();
