-- Admin image uploads previously wrote to the local filesystem
-- (public/uploads/products/), which works in local dev but silently breaks
-- in production: Netlify Functions run on an ephemeral filesystem that isn't
-- shared with the static CDN, so uploaded files vanish and the <img> tag
-- shows broken. Supabase Storage gives uploads a durable, CDN-served home
-- that works identically in dev and prod.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read so storefront/admin <img> tags can load images without auth.
-- Scoped to this bucket only — does not touch policies on any other bucket.
drop policy if exists "public_read_product_images" on storage.objects;
create policy "public_read_product_images"
  on storage.objects for select
  to public
  using (bucket_id = 'product-images');

-- Writes go through the app's service-role client only (supabaseAdmin),
-- which bypasses RLS entirely — no insert/update/delete policy is needed
-- for anon/authenticated, and none is granted.
