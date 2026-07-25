-- Run against an isolated local Supabase database with:
--   supabase test db
-- This suite verifies database invariants without contacting payment providers.
begin;
select plan(9);

insert into public.products (
  slug, name, type, color, short_description, description, seo_title,
  seo_description, base_price, image_url, is_active, track_inventory, stock_quantity
) values (
  '__concurrency_test__', 'Concurrency Test', 'bracelet', 'gold', 'test', 'test',
  'test', 'test', 100, '/main.jpg', true, true, 1
) on conflict (slug) do update set track_inventory=true, stock_quantity=1, is_active=true;

select lives_ok(
  $$select public.reserve_stock('__concurrency_test__', null, 1, 'buyer-a', 900)$$,
  'first buyer reserves the last unit'
);
select throws_ok(
  $$select public.reserve_stock('__concurrency_test__', null, 1, 'buyer-b', 900)$$,
  'P0001', null,
  'second buyer cannot reserve the last unit'
);
select lives_ok($$select public.release_reservation('buyer-a')$$, 'failed payment releases inventory');
select lives_ok(
  $$select public.reserve_stock('__concurrency_test__', null, 1, 'buyer-b', 1)$$,
  'inventory can be reserved after release'
);

update public.stock_reservations set expires_at = now() - interval '1 second' where reservation_token='buyer-b';
select lives_ok($$select public.commit_reservation('buyer-b')$$, 'expired reservation revalidates and commits only while stock remains');

insert into public.promo_codes(code, name, discount_type, discount_value, max_uses, used_count, active)
values ('__ONCE__', 'Concurrency Test', 'percentage', 10, 1, 0, true)
on conflict (code) do update set max_uses=1, used_count=0, active=true;
select lives_ok($$select public.reserve_promo('__ONCE__', 'promo-buyer-a', 900)$$, 'first buyer reserves final promo use');
select throws_ok($$select public.reserve_promo('__ONCE__', 'promo-buyer-b', 900)$$, 'P0001', null, 'promo max-use is concurrency safe');

create temporary table _test_order as
with inserted as (
  insert into public.orders(
    customer_name, customer_email, shipping_address_line1, shipping_city, shipping_state,
    shipping_zip, shipping_country, items, subtotal, shipping, tax, total,
    payment_status, payment_method, payment_reference
  ) values (
    'Test', 'test@example.com', '1 Test St', 'Chicago', 'IL', '60601', 'United States',
    '[]'::jsonb, 100, 0, 0, 100, 'paid', 'stripe', 'pi_concurrency_test'
  ) returning id, order_number
) select * from inserted;

create temporary table _test_return as
with inserted as (
  insert into public.returns(order_id, order_number, customer_name, customer_email, reason, status, refund_amount, refund_status)
  select id, order_number, 'Test', 'test@example.com', 'test', 'shipped_back', 100, 'pending'
  from _test_order
  returning id
) select * from inserted;

select lives_ok(
  format('select public.claim_return_refund(%L)', (select id from _test_return)),
  'first refund worker obtains the atomic claim'
);
select throws_ok(
  format('select public.claim_return_refund(%L)', (select id from _test_return)),
  'P0001', null,
  'refund retry cannot obtain a second claim'
);

select * from finish();
rollback;
