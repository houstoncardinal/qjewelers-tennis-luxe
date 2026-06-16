-- =============================================================================
-- Demo Orders — 28 realistic jewelry orders for Qureshi Jewelers
-- Spans March 17 – June 16, 2026 · Mixed statuses · Real addresses
-- Shipping: $8 standard (2 wks) · $28 express (5-7 days) · Tax ~8%
-- =============================================================================

INSERT INTO public.orders (
  order_number, customer_name, customer_email, customer_phone,
  shipping_address_line1, shipping_address_line2,
  shipping_city, shipping_state, shipping_zip, shipping_country,
  items, subtotal, shipping, tax, total,
  status, shipping_method, payment_status,
  tracking_number, tracking_carrier, notes,
  created_at
) VALUES

-- ═══ DELIVERED (9 orders — completed revenue) ════════════════════════════════

(
  'QJ-3A8F1C2D', 'Sarah Ahmed', 'sarah.ahmed89@gmail.com', '(713) 555-0192',
  '4821 Westheimer Rd', 'Apt 12B',
  'Houston', 'TX', '77027', 'United States',
  '[{"slug":"3mm-gold-moissanite-tennis-chain","name":"3mm Gold Moissanite Tennis Chain","color":"gold","size":"3mm","length":"18\"","unitPrice":259.00,"quantity":1}]'::jsonb,
  259.00, 28.00, 20.72, 307.72,
  'delivered', 'express', 'captured',
  '9400111899223194820283', 'USPS', NULL,
  '2026-03-19 14:32:00+00'
),

(
  'QJ-7B2E9F4A', 'Michael Chen', 'mchen1992@outlook.com', '(415) 555-0847',
  '1250 Columbus Ave', NULL,
  'San Francisco', 'CA', '94133', 'United States',
  '[{"slug":"4mm-gold-moissanite-tennis-bracelet","name":"4mm Gold Moissanite Tennis Bracelet","color":"gold","size":"4mm","length":"8\"","unitPrice":445.00,"quantity":1},{"slug":"3mm-gold-moissanite-tennis-chain","name":"3mm Gold Moissanite Tennis Chain","color":"gold","size":"3mm","length":"20\"","unitPrice":279.00,"quantity":1}]'::jsonb,
  724.00, 28.00, 57.92, 809.92,
  'delivered', 'express', 'captured',
  '1Z999AA10123456784', 'UPS', 'Please gift wrap separately',
  '2026-03-24 09:15:00+00'
),

(
  'QJ-C4D1E8B3', 'Isabella Rodriguez', 'bella.rodriguez@gmail.com', '(305) 555-0463',
  '900 Brickell Ave', 'Suite 1800',
  'Miami', 'FL', '33131', 'United States',
  '[{"slug":"1ct-gold-solitaire-moissanite-ring","name":"1 Carat Gold Solitaire Moissanite Ring","color":"gold","size":"1ct","unitPrice":445.00,"quantity":1}]'::jsonb,
  445.00, 8.00, 36.24, 489.24,
  'delivered', 'standard', 'captured',
  '9261290100830368798070', 'USPS', 'Anniversary gift',
  '2026-04-02 16:48:00+00'
),

(
  'QJ-9E5F3A7C', 'James Williams', 'james.williams.nyc@gmail.com', '(212) 555-0931',
  '350 West 42nd Street', 'Apt 3F',
  'New York', 'NY', '10036', 'United States',
  '[{"slug":"3ct-gold-moissanite-stud-earrings","name":"3ct Gold Moissanite Stud Earrings","color":"gold","size":"3ct","unitPrice":680.00,"quantity":1}]'::jsonb,
  680.00, 28.00, 54.40, 762.40,
  'delivered', 'express', 'captured',
  '794644792798', 'FedEx', 'Surprise for wife — no price info on packing slip please',
  '2026-04-10 11:20:00+00'
),

(
  'QJ-2A6C8F1E', 'Priya Patel', 'priya.k.patel@gmail.com', '(312) 555-0284',
  '233 S Wacker Dr', 'Apt 4501',
  'Chicago', 'IL', '60606', 'United States',
  '[{"slug":"2mm-white-gold-moissanite-tennis-chain","name":"2mm White Gold Moissanite Tennis Chain","color":"white_gold","size":"2mm","length":"16\"","unitPrice":189.00,"quantity":1},{"slug":"gold-moissanite-stud-earrings","name":"Gold Moissanite Stud Earrings","color":"gold","unitPrice":380.00,"quantity":1}]'::jsonb,
  569.00, 8.00, 46.32, 623.32,
  'delivered', 'standard', 'captured',
  '9400111899223287654321', 'USPS', NULL,
  '2026-04-18 08:55:00+00'
),

(
  'QJ-F3B8D2E9', 'David Kim', 'david.kim.biz@gmail.com', '(310) 555-0756',
  '10100 Santa Monica Blvd', 'Unit 2200',
  'Los Angeles', 'CA', '90067', 'United States',
  '[{"slug":"2ct-gold-solitaire-moissanite-ring","name":"2 Carat Gold Solitaire Moissanite Ring","color":"gold","size":"2ct","unitPrice":890.00,"quantity":1}]'::jsonb,
  890.00, 28.00, 71.20, 989.20,
  'delivered', 'express', 'captured',
  '1Z999AA10456789012', 'UPS', 'Engagement ring — priority handling',
  '2026-04-28 14:05:00+00'
),

(
  'QJ-A7E4C1F8', 'Emma Thompson', 'emma.t.jewelry@hotmail.com', '(214) 555-0388',
  '2626 Cole Ave', NULL,
  'Dallas', 'TX', '75204', 'United States',
  '[{"slug":"4mm-rose-gold-moissanite-tennis-chain","name":"4mm Rose Gold Moissanite Tennis Chain","color":"rose_gold","size":"4mm","length":"22\"","unitPrice":349.00,"quantity":1}]'::jsonb,
  349.00, 8.00, 28.72, 385.72,
  'delivered', 'standard', 'captured',
  '9261290100830412345678', 'USPS', NULL,
  '2026-05-06 10:40:00+00'
),

(
  'QJ-B1D9F6A3', 'Marcus Johnson', 'marcusj88@gmail.com', '(404) 555-0612',
  '3344 Peachtree Rd NE', 'Apt 812',
  'Atlanta', 'GA', '30326', 'United States',
  '[{"slug":"3mm-gold-moissanite-tennis-bracelet","name":"3mm Gold Moissanite Tennis Bracelet","color":"gold","size":"3mm","length":"7\"","unitPrice":375.00,"quantity":1},{"slug":"3mm-gold-moissanite-tennis-chain","name":"3mm Gold Moissanite Tennis Chain","color":"gold","size":"3mm","length":"18\"","unitPrice":259.00,"quantity":1}]'::jsonb,
  634.00, 28.00, 50.72, 712.72,
  'delivered', 'express', 'captured',
  '794644792901', 'FedEx', NULL,
  '2026-05-14 15:30:00+00'
),

(
  'QJ-E8C2A5D7', 'Aisha Malik', 'aisha.malik.usa@gmail.com', '(313) 555-0175',
  '1 Woodward Ave', 'Floor 22',
  'Detroit', 'MI', '48226', 'United States',
  '[{"slug":"3ct-rose-gold-moissanite-stud-earrings","name":"3ct Rose Gold Moissanite Stud Earrings","color":"rose_gold","size":"3ct","unitPrice":680.00,"quantity":1}]'::jsonb,
  680.00, 28.00, 54.40, 762.40,
  'delivered', 'express', 'captured',
  '9400111899223378912345', 'USPS', 'Birthday gift, expedite if possible',
  '2026-05-22 09:10:00+00'
),

-- ═══ SHIPPED (7 orders — in transit) ═════════════════════════════════════════

(
  'QJ-D4F7B3E1', 'Tyler Anderson', 'tyler.anderson.co@icloud.com', '(720) 555-0493',
  '1600 Glenarm Place', 'Unit 15',
  'Denver', 'CO', '80203', 'United States',
  '[{"slug":"4mm-gold-moissanite-tennis-chain","name":"4mm Gold Moissanite Tennis Chain","color":"gold","size":"4mm","length":"24\"","unitPrice":389.00,"quantity":1}]'::jsonb,
  389.00, 8.00, 31.92, 428.92,
  'shipped', 'standard', 'captured',
  '9261290100830499876543', 'USPS', NULL,
  '2026-05-28 13:22:00+00'
),

(
  'QJ-6C1A9E4F', 'Sofia Hernandez', 'sofia.hernandez.m@gmail.com', '(602) 555-0827',
  '2 N Central Ave', 'Apt 2004',
  'Phoenix', 'AZ', '85004', 'United States',
  '[{"slug":"2mm-gold-moissanite-tennis-bracelet","name":"2mm Gold Moissanite Tennis Bracelet","color":"gold","size":"2mm","length":"7\"","unitPrice":285.00,"quantity":1}]'::jsonb,
  285.00, 28.00, 22.80, 335.80,
  'shipped', 'express', 'captured',
  '1Z999AA10789012345', 'UPS', NULL,
  '2026-06-01 08:44:00+00'
),

(
  'QJ-8A3F5D2B', 'Ryan O''Brien', 'ryanobrien.mail@gmail.com', '(617) 555-0364',
  '200 State St', NULL,
  'Boston', 'MA', '02109', 'United States',
  '[{"slug":"3mm-silver-moissanite-tennis-chain","name":"3mm Silver Moissanite Tennis Chain","color":"silver","size":"3mm","length":"20\"","unitPrice":219.00,"quantity":1},{"slug":"silver-moissanite-stud-earrings","name":"Silver Moissanite Stud Earrings","color":"silver","unitPrice":380.00,"quantity":1}]'::jsonb,
  599.00, 8.00, 48.72, 655.72,
  'shipped', 'standard', 'captured',
  '794644793024', 'FedEx', NULL,
  '2026-06-03 11:58:00+00'
),

(
  'QJ-5E9B1C8D', 'Fatima Hassan', 'fatima.h.2024@outlook.com', '(206) 555-0641',
  '1201 3rd Ave', 'Suite 5600',
  'Seattle', 'WA', '98101', 'United States',
  '[{"slug":"3ct-gold-solitaire-moissanite-ring","name":"3 Carat Gold Solitaire Moissanite Ring","color":"gold","size":"3ct","unitPrice":1245.00,"quantity":1}]'::jsonb,
  1245.00, 28.00, 99.60, 1372.60,
  'shipped', 'express', 'captured',
  '9400111899223465432109', 'USPS', 'High value — signature required',
  '2026-06-04 16:15:00+00'
),

(
  'QJ-2F6A4E9C', 'Christopher Lee', 'chrislee.j@gmail.com', '(503) 555-0218',
  '811 SW Naito Pkwy', 'Apt 301',
  'Portland', 'OR', '97204', 'United States',
  '[{"slug":"4mm-white-gold-moissanite-tennis-bracelet","name":"4mm White Gold Moissanite Tennis Bracelet","color":"white_gold","size":"4mm","length":"8\"","unitPrice":445.00,"quantity":1}]'::jsonb,
  445.00, 8.00, 36.24, 489.24,
  'shipped', 'standard', 'captured',
  '1Z999AA10234567890', 'UPS', NULL,
  '2026-06-06 09:30:00+00'
),

(
  'QJ-A9D3B7F2', 'Zara Ahmed', 'zara.a.styles@gmail.com', '(615) 555-0583',
  '301 Demonbreun St', 'Unit 1204',
  'Nashville', 'TN', '37201', 'United States',
  '[{"slug":"2mm-rose-gold-moissanite-tennis-chain","name":"2mm Rose Gold Moissanite Tennis Chain","color":"rose_gold","size":"2mm","length":"18\"","unitPrice":195.00,"quantity":1},{"slug":"rose-gold-moissanite-stud-earrings","name":"Rose Gold Moissanite Stud Earrings","color":"rose_gold","unitPrice":380.00,"quantity":1}]'::jsonb,
  575.00, 28.00, 46.00, 649.00,
  'shipped', 'express', 'captured',
  '794644793147', 'FedEx', 'Wedding anniversary — please include gift message',
  '2026-06-08 14:00:00+00'
),

(
  'QJ-3C8E2A6D', 'Keisha Thompson', 'keisha.thompson.atl@gmail.com', '(404) 555-0934',
  '3280 Peachtree Rd NE', 'Apt 410',
  'Atlanta', 'GA', '30305', 'United States',
  '[{"slug":"4mm-gold-moissanite-tennis-chain","name":"4mm Gold Moissanite Tennis Chain","color":"gold","size":"4mm","length":"20\"","unitPrice":349.00,"quantity":2}]'::jsonb,
  698.00, 28.00, 55.84, 781.84,
  'shipped', 'express', 'captured',
  '9261290100830577654321', 'USPS', 'Matching set for couple',
  '2026-06-10 10:45:00+00'
),

-- ═══ PROCESSING (5 orders — need action: making/packing) ═════════════════════

(
  'QJ-7F1D4C9B', 'Jordan Mitchell', 'jordan.mitchell.bkn@gmail.com', '(929) 555-0157',
  '182 Bedford Ave', 'Floor 3',
  'Brooklyn', 'NY', '11249', 'United States',
  '[{"slug":"2ct-rose-gold-solitaire-moissanite-ring","name":"2 Carat Rose Gold Solitaire Moissanite Ring","color":"rose_gold","size":"2ct","unitPrice":890.00,"quantity":1}]'::jsonb,
  890.00, 28.00, 71.20, 989.20,
  'processing', 'express', 'captured',
  NULL, NULL, 'Custom ring sizing — ring size 6.5',
  '2026-06-11 07:30:00+00'
),

(
  'QJ-B5E8F2D4', 'Natasha Rivera', 'natasha.rivera.chi@gmail.com', '(312) 555-0729',
  '540 N Michigan Ave', 'Apt 2301',
  'Chicago', 'IL', '60611', 'United States',
  '[{"slug":"3mm-gold-moissanite-tennis-bracelet","name":"3mm Gold Moissanite Tennis Bracelet","color":"gold","size":"3mm","length":"7\"","unitPrice":375.00,"quantity":1},{"slug":"2ct-gold-moissanite-stud-earrings","name":"2ct Gold Moissanite Stud Earrings","color":"gold","size":"2ct","unitPrice":490.00,"quantity":1}]'::jsonb,
  865.00, 28.00, 69.20, 962.20,
  'processing', 'express', 'captured',
  NULL, NULL, NULL,
  '2026-06-11 13:15:00+00'
),

(
  'QJ-4A7C3F6E', 'Hassan Al-Rashid', 'hassan.alrashid.tx@gmail.com', '(214) 555-0483',
  '1919 McKinney Ave', 'Unit 802',
  'Dallas', 'TX', '75201', 'United States',
  '[{"slug":"4mm-gold-moissanite-tennis-chain","name":"4mm Gold Moissanite Tennis Chain","color":"gold","size":"4mm","length":"22\"","unitPrice":369.00,"quantity":1}]'::jsonb,
  369.00, 8.00, 30.32, 407.32,
  'processing', 'standard', 'captured',
  NULL, NULL, NULL,
  '2026-06-12 09:50:00+00'
),

(
  'QJ-9B2D8E1F', 'Melissa Park', 'mpark.jewelry@gmail.com', '(213) 555-0862',
  '3750 Wilshire Blvd', 'Apt 1501',
  'Los Angeles', 'CA', '90010', 'United States',
  '[{"slug":"1ct-white-gold-solitaire-moissanite-ring","name":"1 Carat White Gold Solitaire Moissanite Ring","color":"white_gold","size":"1ct","unitPrice":445.00,"quantity":1}]'::jsonb,
  445.00, 28.00, 35.60, 508.60,
  'processing', 'express', 'captured',
  NULL, NULL, 'Please include GRA certificate if available',
  '2026-06-13 16:22:00+00'
),

(
  'QJ-6E3A1B9C', 'Darius Washington', 'd.washington.atl@gmail.com', '(678) 555-0316',
  '675 Ponce de Leon Ave NE', 'Unit 204',
  'Atlanta', 'GA', '30308', 'United States',
  '[{"slug":"3mm-gold-moissanite-tennis-chain","name":"3mm Gold Moissanite Tennis Chain","color":"gold","size":"3mm","length":"24\"","unitPrice":279.00,"quantity":1},{"slug":"3mm-gold-moissanite-tennis-bracelet","name":"3mm Gold Moissanite Tennis Bracelet","color":"gold","size":"3mm","length":"8\"","unitPrice":375.00,"quantity":1}]'::jsonb,
  654.00, 8.00, 53.28, 715.28,
  'processing', 'standard', 'captured',
  NULL, NULL, NULL,
  '2026-06-13 18:05:00+00'
),

-- ═══ PENDING (6 orders — need immediate action: just placed) ══════════════════

(
  'QJ-1C4F8B2A', 'Aaliyah Brooks', 'aaliyah.brooks.dc@gmail.com', '(202) 555-0748',
  '2100 Pennsylvania Ave NW', 'Apt 8B',
  'Washington', 'DC', '20037', 'United States',
  '[{"slug":"4mm-gold-moissanite-tennis-bracelet","name":"4mm Gold Moissanite Tennis Bracelet","color":"gold","size":"4mm","length":"7\"","unitPrice":445.00,"quantity":1}]'::jsonb,
  445.00, 28.00, 35.60, 508.60,
  'pending', 'express', 'captured',
  NULL, NULL, NULL,
  '2026-06-14 08:12:00+00'
),

(
  'QJ-5D9C3E7F', 'Leonardo Vasquez', 'leo.vasquez.miami@gmail.com', '(305) 555-0253',
  '1000 Brickell Ave', 'Suite 2100',
  'Miami', 'FL', '33131', 'United States',
  '[{"slug":"3ct-gold-solitaire-moissanite-ring","name":"3 Carat Gold Solitaire Moissanite Ring","color":"gold","size":"3ct","unitPrice":1245.00,"quantity":1}]'::jsonb,
  1245.00, 28.00, 99.60, 1372.60,
  'pending', 'express', 'captured',
  NULL, NULL, 'Propose next week — URGENT',
  '2026-06-14 11:38:00+00'
),

(
  'QJ-8F2E6A4D', 'Camille Okafor', 'camille.okafor@gmail.com', '(713) 555-0590',
  '5151 Buffalo Speedway', 'Apt 303',
  'Houston', 'TX', '77005', 'United States',
  '[{"slug":"2mm-gold-moissanite-tennis-chain","name":"2mm Gold Moissanite Tennis Chain","color":"gold","size":"2mm","length":"18\"","unitPrice":189.00,"quantity":1},{"slug":"gold-moissanite-stud-earrings","name":"Gold Moissanite Stud Earrings","color":"gold","unitPrice":380.00,"quantity":1}]'::jsonb,
  569.00, 8.00, 46.32, 623.32,
  'pending', 'standard', 'captured',
  NULL, NULL, NULL,
  '2026-06-15 09:20:00+00'
),

(
  'QJ-3B7A5C1E', 'Xavier Nguyen', 'xavier.nguyen.sf@icloud.com', '(415) 555-0417',
  '450 Sutter St', 'Unit 1800',
  'San Francisco', 'CA', '94108', 'United States',
  '[{"slug":"4mm-white-gold-moissanite-tennis-chain","name":"4mm White Gold Moissanite Tennis Chain","color":"white_gold","size":"4mm","length":"20\"","unitPrice":389.00,"quantity":1}]'::jsonb,
  389.00, 28.00, 31.12, 448.12,
  'pending', 'express', 'captured',
  NULL, NULL, NULL,
  '2026-06-15 14:55:00+00'
),

(
  'QJ-9E1F7B3C', 'Imani Jackson', 'imani.jackson.ny@gmail.com', '(646) 555-0834',
  '520 W 43rd St', 'Apt 12G',
  'New York', 'NY', '10036', 'United States',
  '[{"slug":"3mm-rose-gold-moissanite-tennis-bracelet","name":"3mm Rose Gold Moissanite Tennis Bracelet","color":"rose_gold","size":"3mm","length":"7\"","unitPrice":375.00,"quantity":1},{"slug":"rose-gold-moissanite-stud-earrings","name":"Rose Gold Moissanite Stud Earrings","color":"rose_gold","unitPrice":380.00,"quantity":1}]'::jsonb,
  755.00, 8.00, 61.68, 824.68,
  'pending', 'standard', 'captured',
  NULL, NULL, 'Mother''s birthday gift',
  '2026-06-16 07:45:00+00'
),

(
  'QJ-4D6C2A8F', 'Omar Siddiqui', 'omar.siddiqui.chi@gmail.com', '(312) 555-0162',
  '111 W Monroe St', 'Apt 3200',
  'Chicago', 'IL', '60603', 'United States',
  '[{"slug":"2ct-gold-solitaire-moissanite-ring","name":"2 Carat Gold Solitaire Moissanite Ring","color":"gold","size":"2ct","unitPrice":890.00,"quantity":1}]'::jsonb,
  890.00, 28.00, 71.20, 989.20,
  'pending', 'express', 'captured',
  NULL, NULL, 'Please confirm ring size availability before processing',
  '2026-06-16 11:02:00+00'
),

-- ═══ CANCELLED (2 orders) ════════════════════════════════════════════════════

(
  'QJ-F7B3A9E2', 'Brittany Sullivan', 'brittany.sull@gmail.com', '(617) 555-0381',
  '100 Federal St', 'Suite 1900',
  'Boston', 'MA', '02110', 'United States',
  '[{"slug":"1ct-rose-gold-solitaire-moissanite-ring","name":"1 Carat Rose Gold Solitaire Moissanite Ring","color":"rose_gold","size":"1ct","unitPrice":445.00,"quantity":1}]'::jsonb,
  445.00, 28.00, 35.60, 508.60,
  'cancelled', 'express', 'refunded',
  NULL, NULL, 'Customer requested cancellation — changed mind',
  '2026-05-03 12:30:00+00'
),

(
  'QJ-2E8D4F6A', 'Brandon Carter', 'brandon.carter.atl@gmail.com', '(770) 555-0749',
  '3500 Lenox Rd NE', 'Apt 901',
  'Atlanta', 'GA', '30326', 'United States',
  '[{"slug":"4mm-gold-moissanite-tennis-chain","name":"4mm Gold Moissanite Tennis Chain","color":"gold","size":"4mm","length":"22\"","unitPrice":369.00,"quantity":1}]'::jsonb,
  369.00, 8.00, 30.32, 407.32,
  'cancelled', 'standard', 'refunded',
  NULL, NULL, 'Payment declined — customer not responsive',
  '2026-05-19 15:45:00+00'
);
