create extension if not exists pgcrypto;

create table if not exists store_settings (
  id int primary key default 1,
  store_name text not null default 'Adicoran',
  badge_text text not null default 'Store akun game',
  headline text not null default 'Mau beli akun game apa?',
  description text not null default 'Pilih game, cek produk unggulan, lalu order langsung ke admin.',
  whatsapp_number text not null default '',
  notice_text text not null default 'Promo bisa berubah kapan saja selama stok masih ada.',
  hero_note text not null default 'Simple store, fast response.',
  footer_text text not null default '© Adicoran',
  updated_at timestamptz default now(),
  constraint one_store_settings check (id = 1)
);

insert into store_settings (id, store_name, badge_text, headline, description, hero_note, notice_text, footer_text)
values (1, 'Adicoran', 'Store akun game', 'Mau beli akun game apa?', 'Pilih game, cek produk unggulan, lalu order langsung ke admin.', 'Simple store, fast response.', 'Promo bisa berubah kapan saja selama stok masih ada.', '© Adicoran')
on conflict (id) do update set store_name = coalesce(store_settings.store_name, excluded.store_name);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  game text not null,
  category text,
  price integer not null check (price >= 0),
  description text,
  status text not null default 'available',
  whatsapp_number text,
  featured boolean not null default false,
  tags text[] not null default '{}',
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 90),
  promo_title text,
  promo_ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table products add column if not exists whatsapp_number text;
alter table products add column if not exists featured boolean not null default false;
alter table products add column if not exists tags text[] not null default '{}';
alter table products add column if not exists discount_percent integer not null default 0;
alter table products add column if not exists promo_title text;
alter table products add column if not exists promo_ends_at timestamptz;

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists products_game_idx on products (game);
create index if not exists products_featured_idx on products (featured);
create index if not exists product_images_product_id_idx on product_images (product_id);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
