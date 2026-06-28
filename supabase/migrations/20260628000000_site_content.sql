-- Site content: key-value store for all editable frontend text and copy.
-- Keys follow the dot-notation pattern section.element.property.
-- Service-role writes bypass RLS so admin server functions can upsert freely.

create table if not exists site_content (
  key        text        primary key,
  value      text        not null default '',
  type       text        not null default 'text',
  section    text        not null default 'general',
  label      text        not null default '',
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

create policy "site_content_public_read" on site_content
  for select using (true);

-- Seed default content mirroring current hardcoded values.
-- on conflict (key) do nothing preserves any existing customizations.
insert into site_content (key, value, type, section, label) values
  ('home.hero.badge',          'VVS1 · D Color · GRA Certified',                                                                                                                         'text', 'home',   'Hero — Certification Badge'),
  ('home.hero.headline_line1', 'The World''s Most',                                                                                                                                      'text', 'home',   'Hero — Headline Line 1'),
  ('home.hero.headline_line2', 'Brilliant Gemstone.',                                                                                                                                    'text', 'home',   'Hero — Headline Line 2'),
  ('home.hero.subheadline',    'D Colorless moissanite with more fire than diamond — hand-set in 18K gold-plated sterling silver. Every piece independently GRA certified.',             'text', 'home',   'Hero — Subheadline'),
  ('home.hero.cta_primary',    'Shop Collection',                                                                                                                                        'text', 'home',   'Hero — Primary CTA'),
  ('home.hero.cta_secondary',  'Our Stone',                                                                                                                                              'text', 'home',   'Hero — Secondary CTA'),
  ('home.trust.gra',           'GRA Certified',                                                                                                                                          'text', 'home',   'Hero — Trust: GRA Badge'),
  ('home.trust.color',         'VVS1 D Color',                                                                                                                                           'text', 'home',   'Hero — Trust: Color Badge'),
  ('home.trust.shipping',      'Free US Shipping',                                                                                                                                       'text', 'home',   'Hero — Trust: Shipping Badge'),
  ('home.science.title',       'The Science of Brilliance',                                                                                                                              'text', 'home',   'Science Section — Title'),
  ('home.science.subtitle',    'Not a substitute. A discovery. Moissanite outperforms diamond in every measurable way — and costs a fraction of the price.',                             'text', 'home',   'Science Section — Subtitle'),
  ('home.ethics.title',        'Brilliance that never costs the earth.',                                                                                                                  'text', 'home',   'Ethics Section — Title'),
  ('home.certification.title', 'Every stone, independently verified.',                                                                                                                   'text', 'home',   'Certification Section — Title'),
  ('home.reviews.title',       'Trusted by thousands',                                                                                                                                   'text', 'home',   'Reviews Section — Title'),
  ('footer.tagline',           'Premium Moissanite Jewelry',                                                                                                                             'text', 'footer', 'Footer — Tagline'),
  ('footer.copyright',         '© 2026 Qureshi Jewelers. All rights reserved.',                                                                                                          'text', 'footer', 'Footer — Copyright'),
  ('seo.site_title',           'Qureshi Jewelers — S925 VVS Moissanite Tennis Chains',                                                                                                   'text', 'seo',    'SEO — Site Title'),
  ('seo.site_description',     'America''s premier source for iced out S925 sterling silver, VVS moissanite tennis chains and bracelets. GRA certified. Free US shipping over $250.',  'text', 'seo',    'SEO — Meta Description')
on conflict (key) do nothing;
