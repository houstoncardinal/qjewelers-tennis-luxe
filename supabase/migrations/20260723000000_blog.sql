-- Blog: authors (E-E-A-T author entity) + posts. Admin-managed via
-- supabaseAdmin (service_role bypasses RLS), so only a public SELECT policy
-- is added — no anon/authenticated write policy is created, which correctly
-- denies writes to those roles by default under RLS.

CREATE TABLE IF NOT EXISTS public.blog_authors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  title       text NOT NULL DEFAULT '',
  bio         text NOT NULL DEFAULT '',
  credentials text NOT NULL DEFAULT '',
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_authors_public_read" ON public.blog_authors
  FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text UNIQUE NOT NULL,
  title              text NOT NULL,
  excerpt            text NOT NULL DEFAULT '',
  content            text NOT NULL DEFAULT '',
  cover_image_url    text,
  cover_image_alt    text NOT NULL DEFAULT '',
  category           text NOT NULL DEFAULT 'education',
  tags               text[] NOT NULL DEFAULT '{}',
  author_id          uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  seo_title          text,
  seo_description    text,
  faq                jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{ "question": "...", "answer": "..." }]
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  read_time_minutes  integer NOT NULL DEFAULT 5,
  is_featured        boolean NOT NULL DEFAULT false,
  published_at       timestamptz,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT USING (status = 'published');
