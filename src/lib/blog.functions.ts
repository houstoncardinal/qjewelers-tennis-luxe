import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdmin } from "@/lib/admin.functions";

// blog_authors / blog_posts aren't in the generated Supabase types (migration
// applied separately), so we bypass the type-checker the same way
// admin_users / site_content are handled.
const db = supabaseAdmin as any;

export interface BlogAuthor {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  credentials: string;
  avatar_url: string | null;
}

export interface BlogFaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string;
  category: string;
  tags: string[];
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  faq: BlogFaqItem[];
  status: "draft" | "published";
  read_time_minutes: number;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  author?: BlogAuthor | null;
}

const POST_SELECT = "*, author:blog_authors(*)";

// ─── Public ───────────────────────────────────────────────────────────────────

export const listBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await db
    .from("blog_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) {
    console.error("[Blog] listBlogPosts:", error.message);
    return { posts: [] as BlogPost[] };
  }
  return { posts: (data ?? []) as BlogPost[] };
});

export const getBlogPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: post, error } = await db
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return { post: null, related: [] as BlogPost[] };

    const { data: related } = await db
      .from("blog_posts")
      .select(POST_SELECT)
      .eq("status", "published")
      .eq("category", post.category)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(3);

    return { post: post as BlogPost, related: (related ?? []) as BlogPost[] };
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const listAdminBlogPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: posts, error } = await db
      .from("blog_posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { posts: (posts ?? []) as BlogPost[] };
  });

export const listBlogAuthors = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { data: authors, error } = await db.from("blog_authors").select("*").order("name");
    if (error) throw new Error(error.message);
    return { authors: (authors ?? []) as BlogAuthor[] };
  });

export const createBlogPost = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    cover_image_url?: string | null;
    cover_image_alt?: string;
    category: string;
    tags?: string[];
    author_id?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    faq?: BlogFaqItem[];
    status: "draft" | "published";
    read_time_minutes?: number;
    is_featured?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, ...fields } = data;
    const { data: created, error } = await db
      .from("blog_posts")
      .insert({
        ...fields,
        slug: fields.slug.trim().toLowerCase(),
        published_at: fields.status === "published" ? new Date().toISOString() : null,
      })
      .select(POST_SELECT)
      .single();
    if (error) throw new Error(error.message);
    return { post: created as BlogPost };
  });

export const updateBlogPost = createServerFn({ method: "POST" })
  .inputValidator((d: {
    token: string;
    id: string;
    title?: string;
    excerpt?: string;
    content?: string;
    cover_image_url?: string | null;
    cover_image_alt?: string;
    category?: string;
    tags?: string[];
    author_id?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    faq?: BlogFaqItem[];
    status?: "draft" | "published";
    read_time_minutes?: number;
    is_featured?: boolean;
  }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { token: _t, id, ...fields } = data;

    // Only stamp published_at the first time a post transitions into
    // "published" — editing a live post afterward shouldn't reset its date.
    let publishedAtPatch: { published_at?: string } = {};
    if (fields.status === "published") {
      const { data: existing } = await db.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
      if (!existing?.published_at) publishedAtPatch = { published_at: new Date().toISOString() };
    }

    const { error } = await db
      .from("blog_posts")
      .update({ ...fields, ...publishedAtPatch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => d)
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { error } = await db.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
