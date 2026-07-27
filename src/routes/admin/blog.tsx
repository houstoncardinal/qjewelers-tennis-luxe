import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Trash2, X, Pencil, Newspaper, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  listAdminBlogPosts, listBlogAuthors, createBlogPost, updateBlogPost, deleteBlogPost,
  type BlogPost, type BlogFaqItem,
} from "@/lib/blog.functions";
import { useAdminToken } from "@/lib/admin-context";

export const Route = createFileRoute("/admin/blog")({
  component: AdminBlog,
});

const CATEGORIES = [
  { value: "education", label: "Education" },
  { value: "buying-guide", label: "Buying Guide" },
  { value: "comparison", label: "Comparison" },
  { value: "care", label: "Care & Maintenance" },
];

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY_FAQ: BlogFaqItem = { question: "", answer: "" };

function PostModal({
  initial,
  authors,
  onClose,
  onSaved,
}: {
  initial?: BlogPost;
  authors: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const token = useAdminToken();
  const isEdit = !!initial;
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    cover_image_url: initial?.cover_image_url ?? "",
    cover_image_alt: initial?.cover_image_alt ?? "",
    category: initial?.category ?? "education",
    tags: (initial?.tags ?? []).join(", "),
    author_id: initial?.author_id ?? authors[0]?.id ?? "",
    seo_title: initial?.seo_title ?? "",
    seo_description: initial?.seo_description ?? "",
    status: initial?.status ?? ("draft" as "draft" | "published"),
    read_time_minutes: initial?.read_time_minutes ?? 5,
    is_featured: initial?.is_featured ?? false,
  });
  const [faq, setFaq] = useState<BlogFaqItem[]>(initial?.faq?.length ? initial.faq : [{ ...EMPTY_FAQ }]);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  const createFn = useServerFn(createBlogPost);
  const updateFn = useServerFn(updateBlogPost);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const cleanedFaq = () => faq.filter((f) => f.question.trim() && f.answer.trim());

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        cover_image_url: form.cover_image_url.trim() || null,
        cover_image_alt: form.cover_image_alt.trim(),
        category: form.category,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        author_id: form.author_id || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        faq: cleanedFaq(),
        status: form.status,
        read_time_minutes: Number(form.read_time_minutes) || 5,
        is_featured: form.is_featured,
      };
      if (isEdit) {
        await updateFn({ data: { token, id: initial.id, ...payload } });
        toast.success("Post updated");
      } else {
        await createFn({ data: { token, slug: form.slug.trim(), ...payload } });
        toast.success("Post created");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full border border-gray-200 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-gray-400 transition-colors bg-white";
  const labelCls = "block text-[0.58rem] uppercase tracking-[0.16em] text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <p className="text-sm font-semibold text-gray-900">{isEdit ? `Edit · ${initial.title}` : "New Blog Post"}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={save} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
              }}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Slug *</label>
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
              className={`${inputCls} font-mono`}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Excerpt</label>
            <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category} onChange={set("category")} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Author</label>
              <select value={form.author_id} onChange={set("author_id")} className={inputCls}>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cover Image URL</label>
              <input value={form.cover_image_url} onChange={set("cover_image_url")} placeholder="/main.jpg" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cover Image Alt Text</label>
              <input value={form.cover_image_alt} onChange={set("cover_image_alt")} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Content (HTML)</label>
            <textarea
              value={form.content}
              onChange={set("content")}
              rows={16}
              className={`${inputCls} font-mono text-xs leading-relaxed`}
              placeholder="<p>...</p><h2>...</h2>"
            />
            <p className="mt-1.5 text-[0.58rem] text-gray-400">Use &lt;h2&gt;/&lt;h3&gt;/&lt;p&gt;/&lt;ul&gt;/&lt;table&gt; — rendered directly on the article page.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tags (comma-separated)</label>
              <input value={form.tags} onChange={set("tags")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Read Time (minutes)</label>
              <input type="number" min={1} value={form.read_time_minutes} onChange={set("read_time_minutes")} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>SEO Title (optional — defaults to Title)</label>
            <input value={form.seo_title} onChange={set("seo_title")} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>SEO Description (optional — defaults to Excerpt)</label>
            <textarea value={form.seo_description} onChange={set("seo_description")} rows={2} className={inputCls} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelCls}>FAQ (powers FAQPage schema)</label>
              <button type="button" onClick={() => setFaq((f) => [...f, { ...EMPTY_FAQ }])}
                className="text-[0.56rem] uppercase tracking-[0.12em] text-gray-500 hover:text-gray-800 transition-colors">
                + Add Question
              </button>
            </div>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <div key={i} className="border border-gray-200 p-3 space-y-2 relative">
                  <button type="button" onClick={() => setFaq((f) => f.filter((_, idx) => idx !== i))}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <input
                    value={item.question}
                    onChange={(e) => setFaq((f) => f.map((x, idx) => idx === i ? { ...x, question: e.target.value } : x))}
                    placeholder="Question"
                    className={`${inputCls} text-xs font-medium pr-8`}
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => setFaq((f) => f.map((x, idx) => idx === i ? { ...x, answer: e.target.value } : x))}
                    placeholder="Answer"
                    rows={2}
                    className={`${inputCls} text-xs`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="post-featured" checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                className="accent-gray-900" />
              <label htmlFor="post-featured" className="text-sm text-gray-700">Featured</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 py-2.5 text-[0.65rem] uppercase tracking-[0.14em] text-gray-500 hover:border-gray-400 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-gray-900 text-white py-2.5 text-[0.65rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminBlog() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listAdminBlogPosts);
  const authorsFn = useServerFn(listBlogAuthors);
  const deleteFn = useServerFn(deleteBlogPost);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: () => listFn({ data: { token } }),
  });
  const { data: authorsData } = useQuery({
    queryKey: ["admin-blog-authors"],
    queryFn: () => authorsFn({ data: { token } }),
  });

  const posts = (data?.posts ?? []) as BlogPost[];
  const authors = authorsData?.authors ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [editPost, setEditPost] = useState<BlogPost | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    setShowCreate(false);
    setEditPost(null);
  };

  const remove = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteFn({ data: { token, id } });
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete post");
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-gray-400" /> Blog
          </h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!authors.length}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 text-[0.62rem] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> New Post
        </button>
      </div>

      {!authors.length && !isLoading && (
        <p className="text-xs text-green-600 mb-4">No blog author exists yet — create one in the database before adding posts.</p>
      )}

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">No posts yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Title", "Category", "Status", "Published", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[0.55rem] uppercase tracking-[0.14em] text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{p.title}</p>
                    <p className="text-[0.62rem] text-gray-400 font-mono mt-0.5">/blog/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 capitalize">{p.category.replace("-", " ")}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.08em] font-medium rounded-sm ${p.status === "published" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === "published" ? "bg-emerald-400" : "bg-gray-400"}`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {p.status === "published" && (
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" title="View live" className="text-gray-300 hover:text-gray-700 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button onClick={() => setEditPost(p)} title="Edit" className="text-gray-300 hover:text-gray-700 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(p.id, p.title)} title="Delete" className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <PostModal authors={authors} onClose={() => setShowCreate(false)} onSaved={refresh} />}
      {editPost && <PostModal initial={editPost} authors={authors} onClose={() => setEditPost(null)} onSaved={refresh} />}
    </div>
  );
}
