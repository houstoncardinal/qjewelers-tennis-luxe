-- ─── Customer Features Migration ────────────────────────────────────────────
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- All tables use Row Level Security. Service role bypasses RLS for server-side ops.

-- ─── Customer Addresses ───────────────────────────────────────────────────────

create table if not exists customer_addresses (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  line1       text        not null,
  line2       text,
  city        text        not null,
  state       text        not null,
  zip         text        not null,
  country     text        not null default 'United States',
  phone       text,
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table customer_addresses enable row level security;

create policy "Users manage own addresses"
  on customer_addresses for all
  using (auth.uid() = user_id);

create index if not exists customer_addresses_user_id_idx on customer_addresses(user_id);

-- ─── Wishlist Items ───────────────────────────────────────────────────────────

create table if not exists wishlist_items (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  product_slug text        not null,
  added_at     timestamptz not null default now(),
  unique(user_id, product_slug)
);

alter table wishlist_items enable row level security;

create policy "Users manage own wishlist"
  on wishlist_items for all
  using (auth.uid() = user_id);

create index if not exists wishlist_items_user_id_idx on wishlist_items(user_id);

-- ─── Abandoned Carts ─────────────────────────────────────────────────────────
-- Saved server-side by service role only. One row per signed-in user.

create table if not exists abandoned_carts (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references auth.users(id) on delete set null,
  user_email       text        not null,
  cart_items       jsonb       not null default '[]',
  cart_total       numeric(10,2),
  recovery_status  text        not null default 'pending'
                               check (recovery_status in ('pending','email_sent','recovered','expired')),
  email_sent_at    timestamptz,
  recovered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(user_id)
);

alter table abandoned_carts enable row level security;

-- Service role key bypasses RLS automatically; this policy blocks anon/user access
create policy "Service role only"
  on abandoned_carts for all
  using (auth.jwt() ->> 'role' = 'service_role');

create index if not exists abandoned_carts_status_idx on abandoned_carts(recovery_status);
create index if not exists abandoned_carts_created_idx on abandoned_carts(created_at desc);

-- ─── Abandoned Cart Settings (admin-managed) ──────────────────────────────────

create table if not exists abandoned_cart_settings (
  id          uuid        primary key default gen_random_uuid(),
  key         text        unique not null,
  value       text        not null,
  updated_at  timestamptz not null default now()
);

alter table abandoned_cart_settings enable row level security;

create policy "Service role only"
  on abandoned_cart_settings for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Seed default settings
insert into abandoned_cart_settings (key, value) values
  ('enabled',       'true'),
  ('delay_minutes', '60'),
  ('email_subject', 'You left something behind ✨'),
  ('email_body',    'Hi,\n\nYou left {{item_count}} item(s) in your cart at Qureshi Jewelers.\n\nYour cart:\n{{items_list}}\n\nComplete your purchase:\n{{cart_url}}\n\n— Qureshi Jewelers')
on conflict (key) do nothing;
