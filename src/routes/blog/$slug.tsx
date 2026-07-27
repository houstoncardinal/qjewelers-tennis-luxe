import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { getBlogPostBySlug, type BlogPost } from "@/lib/blog.functions";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://qureshijewelers.com").replace(/\/$/, "");

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

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const res = await getBlogPostBySlug({ data: { slug: params.slug } });
    if (!res.post) throw notFound();
    return res;
  },
  head: ({ loaderData, params }) => {
    const post = (loaderData as any)?.post as BlogPost | undefined;
    const pageUrl = `${SITE_URL}/blog/${params.slug}`;
    if (!post) return { meta: [{ title: "Article Not Found | Qureshi Jewelers" }] };

    const title = post.seo_title?.trim() || `${post.title} | Qureshi Jewelers`;
    const description = post.seo_description?.trim() || post.excerpt;
    const imageUrl = post.cover_image_url?.startsWith("http")
      ? post.cover_image_url
      : `${SITE_URL}${post.cover_image_url ?? "/main.jpg"}`;
    const authorName = post.author?.name ?? "Qureshi Jewelers Editorial Team";
    const publishedIso = post.published_at ?? post.created_at;
    const modifiedIso = post.updated_at;

    const faqSchema = (post.faq ?? []).length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (post.faq ?? []).map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: pageUrl },
        { property: "og:type", content: "article" },
        { property: "og:image", content: imageUrl },
        { property: "article:published_time", content: publishedIso },
        { property: "article:modified_time", content: modifiedIso },
        { property: "article:section", content: CATEGORY_LABELS[post.category] ?? post.category },
        { property: "article:author", content: authorName },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${pageUrl}#article`,
            mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
            headline: post.title,
            description,
            image: [imageUrl],
            datePublished: publishedIso,
            dateModified: modifiedIso,
            articleSection: CATEGORY_LABELS[post.category] ?? post.category,
            keywords: (post.tags ?? []).join(", "),
            author: {
              "@type": "Organization",
              name: authorName,
              url: `${SITE_URL}/about`,
            },
            publisher: {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: "Qureshi Jewelers",
              logo: { "@type": "ImageObject", url: `${SITE_URL}/QURESHIJEWELERSLOGO.png` },
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
            ],
          }),
        },
        ...(faqSchema ? [{ type: "application/ld+json", children: JSON.stringify(faqSchema) }] : []),
      ],
    };
  },
  component: BlogArticle,
});

function BlogArticle() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const fetchPost = useServerFn(getBlogPostBySlug);
  const { data } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchPost({ data: { slug } }),
    initialData: loaderData,
  });

  const post = data?.post as BlogPost | null;
  const related = (data?.related ?? []) as BlogPost[];
  if (!post) return null;

  return (
    <>
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pt-10 sm:pt-14">
        <nav className="flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground/60">
          <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-green-600">{CATEGORY_LABELS[post.category] ?? post.category}</span>
        </nav>

        <h1 className="mt-4 font-display text-3xl sm:text-5xl leading-[1.08]">{post.title}</h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
          <span className="font-medium text-foreground">{post.author?.name ?? "Qureshi Jewelers Editorial Team"}</span>
          <span>·</span>
          <span>{formatDate(post.published_at)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.read_time_minutes} min read</span>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 mt-8 sm:mt-10">
        <div className="aspect-[16/9] overflow-hidden rounded-xl sm:rounded-2xl bg-cream">
          <img
            src={post.cover_image_url ?? "/main.jpg"}
            alt={post.cover_image_alt || post.title}
            loading="eager"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <div
          className="
            text-[0.98rem] leading-[1.85] text-[#3a3630]
            [&_h2]:font-display [&_h2]:text-2xl [&_h2]:sm:text-3xl [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:leading-tight [&_h2]:text-foreground
            [&_h3]:font-display [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:leading-tight [&_h3]:text-foreground
            [&_p]:mb-5
            [&_ul]:mb-5 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2
            [&_ol]:mb-5 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2
            [&_li]:leading-relaxed
            [&_strong]:font-semibold [&_strong]:text-foreground
            [&_a]:text-green-600 [&_a]:underline [&_a]:underline-offset-2
            [&_blockquote]:border-l-2 [&_blockquote]:border-green-600 [&_blockquote]:pl-5 [&_blockquote]:my-6 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
            [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:text-sm
            [&_th]:text-left [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:text-[0.68rem] [&_th]:text-muted-foreground [&_th]:font-medium [&_th]:border-b [&_th]:border-border [&_th]:py-2.5 [&_th]:pr-4
            [&_td]:border-b [&_td]:border-border/60 [&_td]:py-2.5 [&_td]:pr-4
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {(post.faq ?? []).length > 0 && (
          <div className="mt-14 pt-10 border-t border-border">
            <p className="eyebrow">Frequently Asked Questions</p>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl">Common Questions</h2>
            <div className="mt-6 divide-y divide-border">
              {post.faq.map((item, i) => (
                <div key={i} className="py-5">
                  <h3 className="font-display text-lg text-foreground">{item.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author box — E-E-A-T authorship signal */}
        <div className="mt-14 p-6 sm:p-8 bg-cream border border-border flex gap-4">
          <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground/70">Written by</p>
            <p className="mt-1 font-display text-lg">{post.author?.name ?? "Qureshi Jewelers Editorial Team"}</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {post.author?.bio ??
                "Our in-house team sources, grades, and hand-sets every GRA-certified moissanite stone we sell — this guide reflects what we've learned doing that work every day."}
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8 bg-foreground text-background">
          <div>
            <p className="font-display text-xl">Ready to see it in person?</p>
            <p className="mt-1 text-sm text-background/70">Browse GRA-certified moissanite, hand-set in S925 sterling silver.</p>
          </div>
          <Link
            to="/shop"
            className="shrink-0 inline-flex items-center gap-2 bg-background text-foreground px-6 py-3 text-[0.62rem] uppercase tracking-[0.2em] hover:bg-background/90 transition-colors"
          >
            Shop the Collection <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-cream/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14">
            <p className="eyebrow">Keep Reading</p>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl mb-8">More on {CATEGORY_LABELS[post.category] ?? post.category}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group block">
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-cream">
                    <img
                      src={p.cover_image_url ?? "/main.jpg"}
                      alt={p.cover_image_alt || p.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <h3 className="mt-3 font-display text-lg leading-tight line-clamp-2 group-hover:text-green-600 transition-colors">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
