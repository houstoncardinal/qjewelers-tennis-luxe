begin;
select plan(16);

select ok(
  not exists(select 1 from pg_policies where schemaname='public' and tablename='orders' and policyname='orders_public_insert'),
  'anonymous direct order insertion policy is removed'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='public' and tablename='pending_orders' and cmd='ALL' and roles='{public}' and qual='true'),
  'pending orders have no allow-all public policy'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='public' and tablename='stock_reservations' and cmd='ALL' and roles='{public}' and qual='true'),
  'stock reservations have no allow-all public policy'
);
select ok(
  not exists(select 1 from pg_policies where schemaname='public' and tablename='product_images' and cmd='ALL' and roles='{public}' and qual='true'),
  'product image writes have no allow-all public policy'
);

select ok(not has_function_privilege('anon', 'public.reserve_stock(text,uuid,integer,text,integer)', 'EXECUTE'), 'anon cannot reserve stock');
select ok(not has_function_privilege('authenticated', 'public.reserve_stock(text,uuid,integer,text,integer)', 'EXECUTE'), 'customers cannot reserve stock directly');
select ok(not has_function_privilege('anon', 'public.commit_reservation(text)', 'EXECUTE'), 'anon cannot commit inventory');
select ok(not has_function_privilege('anon', 'public.release_reservation(text)', 'EXECUTE'), 'anon cannot release inventory');
select ok(not has_function_privilege('anon', 'public.reserve_promo(text,text,integer)', 'EXECUTE'), 'anon cannot reserve promo uses');
select ok(not has_function_privilege('anon', 'public.claim_return_refund(uuid)', 'EXECUTE'), 'anon cannot claim refunds');
select ok(has_function_privilege('service_role', 'public.reserve_stock(text,uuid,integer,text,integer)', 'EXECUTE'), 'service role can reserve stock');
select ok(has_function_privilege('service_role', 'public.commit_reservation(text)', 'EXECUTE'), 'service role can commit inventory');

select col_is_pk('public', 'pending_orders', 'id', 'pending orders have a primary key');
select has_column('public', 'pending_orders', 'processing_started_at', 'pending orders track processing leases');
select has_table('public', 'promo_reservations', 'promo reservations exist');
select has_function('public', 'expire_checkout_reservations', array[]::text[], 'checkout expiration worker exists');

select * from finish();
rollback;

