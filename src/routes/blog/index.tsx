import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ArrowRight, Clock } from "lucide-react";
import { listBlogPosts, type BlogPost } from "@/lib/blog.functions";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

const search = z.object({
  category: z.string().optional(),
});

const CATEGORY_LABELS: Record<string, string> = {
  education: "Education",
  "buying-guide": "Buying Guides",
  comparison: "Comparisons",
  care: "Care & Maintenance",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export const Route = createFileRoute("/blog/")({
  validateSearch: search,
  // SSR the post list so crawlers (and AI bots that don't execute JS) see
  // real article links and titles in the initial HTML.
  loader: async () => {
    const res = await listBlogPosts();
    return res;
  },
  head: ({ loaderData }) => {
    const pageUrl = `${SITE_URL}/blog`;
    const title = "The Moissanite Journal — Guides, Grading & Care | Qureshi Jewelers";
    const description =
      "Expert guides on moissanite quality, grading, pricing, and care — written by the Qureshi Jewelers team. Everything you need to know before you buy.";

    const posts = ((loaderData as any)?.posts ?? []) as BlogPost[];
    const itemListElement = posts.slice(0, 20).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}/blog/${p.slug}`,
    }));

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: pageUrl },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "@id": `${pageUrl}#blog`,
            name: "The Moissanite Journal",
            description,
            url: pageUrl,
            publisher: { "@id": `${SITE_URL}/#organization` },
            isPartOf: { "@id": `${SITE_URL}/#website` },
          }),
        },
        ...(itemListElement.length > 0
          ? [{
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                itemListElement,
              }),
            }]
          : []),
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Blog", item: pageUrl },
            ],
          }),
        },
      ],
    };
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { category } = Route.useSearch();
  const loaderData = Route.useLoaderData();
  const fetchPosts = useServerFn(listBlogPosts);
  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetchPosts(),
    initialData: loaderData,
  });

  const posts = (data?.posts ?? []) as BlogPost[];
  const categories = [...new Set(posts.map((p) => p.category))];
  const filtered = category ? posts.filter((p) => p.category === category) : posts;
  const featured = !category ? posts.find((p) => p.is_featured) ?? posts[0] : null;
  const rest = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-14 sm:pt-16 pb-10 sm:pb-12">
        <p className="eyebrow">The Moissanite Journal</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-7xl leading-[1.04]">
          Guides Worth Reading
        </h1>
        <p className="mt-4 text-muted-foreground max-w-lg">
          Grading, buying, and caring for moissanite — written by the people who source and set
          every stone we sell.
        </p>
      </section>

      {categories.length > 1 && (
        <div className="border-y border-border bg-background/95">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
            <div className="flex items-center h-11 gap-1.5 overflow-x-auto scrollbar-none">
              <Link
                to="/blog"
                className={`px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.16em] border transition-colors duration-150 whitespace-nowrap ${!category ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  to="/blog"
                  search={{ category: c }}
                  className={`px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.16em] border transition-colors duration-150 whitespace-nowrap ${category === c ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
                >
                  {CATEGORY_LABELS[c] ?? c}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-10 sm:py-14 pb-24 sm:pb-28">
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="aspect-[16/10] rounded-xl bg-cream animate-pulse" />
                <div className="mt-4 h-3 bg-cream animate-pulse w-1/3 rounded-full" />
                <div className="mt-2.5 h-5 bg-cream animate-pulse w-3/4 rounded-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-32">
            <p className="font-display text-3xl text-foreground">New guides are on the way.</p>
            <p className="mt-3 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <>
            {featured && (
              <Link
                to="/blog/$slug"
                params={{ slug: featured.slug }}
                className="group grid lg:grid-cols-2 gap-6 lg:gap-10 mb-16 lg:mb-20 items-center"
              >
                <div className="aspect-[16/11] overflow-hidden rounded-xl sm:rounded-2xl bg-cream">
                  <img
                    src={featured.cover_image_url ?? "/main.jpg"}
                    alt={featured.cover_image_alt || featured.title}
                    loading="eager"
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] text-green-600 font-medium">
                    {CATEGORY_LABELS[featured.category] ?? featured.category}
                  </p>
                  <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-[1.08] group-hover:text-green-600 transition-colors duration-300">
                    {featured.title}
                  </h2>
                  <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                    {featured.excerpt}
                  </p>
                  <div className="mt-5 flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground/70">
                    <span>{featured.author?.name ?? "Qureshi Jewelers"}</span>
                    <span>·</span>
                    <span>{formatDate(featured.published_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.read_time_minutes} min read</span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] border-b border-foreground pb-1 group-hover:text-green-600 group-hover:border-green-600 transition-colors">
                    Read the Guide <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {rest.map((post) => (
                <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-cream">
                    <img
                      src={post.cover_image_url ?? "/main.jpg"}
                      alt={post.cover_image_alt || post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-4 text-[0.56rem] uppercase tracking-[0.18em] text-green-600 font-medium">
                    {CATEGORY_LABELS[post.category] ?? post.category}
                  </p>
                  <h3 className="mt-2 font-display text-xl leading-tight line-clamp-2 min-h-[2.4em] group-hover:text-green-600 transition-colors duration-300">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[0.56rem] uppercase tracking-[0.12em] text-muted-foreground/60">
                    <span>{formatDate(post.published_at)}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {post.read_time_minutes} min</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
