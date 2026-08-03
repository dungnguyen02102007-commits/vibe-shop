-- =====================================================================
-- MarketConnect / vibe-shop — Thiết lập Supabase
-- Chạy toàn bộ file này trong: Supabase Dashboard > SQL Editor > New query
-- Script an toàn khi chạy lại nhiều lần (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. BẢNG PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  phone      text,
  zalo       text,
  role       text not null default 'buyer',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists full_name  text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists zalo       text;
alter table public.profiles add column if not exists role       text default 'buyer';
alter table public.profiles add column if not exists created_at timestamptz default now();

-- ---------------------------------------------------------------------
-- 2. BẢNG PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  price       numeric,
  description text,
  image_url   text,
  image_path  text,
  created_at  timestamptz not null default now()
);

-- image_path dùng để xoá đúng file ảnh trong Storage khi seller xoá sản phẩm.
alter table public.products add column if not exists image_path text;

create index if not exists products_seller_id_idx  on public.products (seller_id);
create index if not exists products_created_at_idx on public.products (created_at desc);

-- ---------------------------------------------------------------------
-- 3. RLS CHO PROFILES
--    Đọc công khai (buyer cần xem SĐT/Zalo người bán).
--    Mỗi người chỉ ghi được dòng của chính mình.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public"  on public.profiles;
drop policy if exists "profiles_insert_own"     on public.profiles;
drop policy if exists "profiles_update_own"     on public.profiles;

create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 4. RLS CHO PRODUCTS
--    Ai cũng xem được hàng. Chỉ chủ sở hữu mới thêm/sửa/xoá.
-- ---------------------------------------------------------------------
alter table public.products enable row level security;

drop policy if exists "products_select_public"    on public.products;
drop policy if exists "products_insert_own"       on public.products;
drop policy if exists "products_update_own"       on public.products;
drop policy if exists "products_delete_own"       on public.products;

create policy "products_select_public"
  on public.products for select
  using (true);

create policy "products_insert_own"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "products_update_own"
  on public.products for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "products_delete_own"
  on public.products for delete
  using (auth.uid() = seller_id);

-- ---------------------------------------------------------------------
-- 5. STORAGE BUCKET product-images (công khai để hiện ảnh)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product_images_read_public"  on storage.objects;
drop policy if exists "product_images_insert_own"   on storage.objects;
drop policy if exists "product_images_update_own"   on storage.objects;
drop policy if exists "product_images_delete_own"   on storage.objects;

create policy "product_images_read_public"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Ảnh phải nằm trong thư mục mang tên user id: <uid>/ten-file.jpg
create policy "product_images_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- 6. TỰ TẠO PROFILE KHI CÓ USER MỚI (lớp bảo hiểm cho phía frontend)
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, zalo, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'zalo', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 7. REALTIME: sản phẩm mới hiện ngay không cần tải lại trang
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.products;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
