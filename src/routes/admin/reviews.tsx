import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Check, X, ExternalLink, ShieldCheck, Filter, RefreshCw } from "lucide-react";
import { useAdminToken } from "@/lib/admin-context";
import { listAdminReviews, approveReview, rejectReview } from "@/lib/admin-extended.functions";

export const Route = createFileRoute("/admin/reviews")({
  component: AdminReviews,
});

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          style={{ color: i <= rating ? "#f59e0b" : "#e5e7eb" }}
          fill={i <= rating ? "#f59e0b" : "none"}
        />
      ))}
    </div>
  );
}

function AdminReviews() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const fetchReviews = useServerFn(listAdminReviews);
  const doApprove   = useServerFn(approveReview);
  const doReject    = useServerFn(rejectReview);

  const [filter, setFilter]   = useState<"all" | "pending" | "approved">("pending");
  const [acting, setActing]   = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews", token, filter],
    queryFn: () => fetchReviews({ data: { token, filter } }),
    enabled: !!token,
  });

  const reviews = data?.reviews ?? [];
  const pendingCount = reviews.filter(r => !r.approved).length;

  const handleApprove = async (id: string) => {
    setActing(id);
    try {
      await doApprove({ data: { token, id } });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review approved and published");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to approve");
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Delete review from "${name}"? This cannot be undone.`)) return;
    setActing(id);
    try {
      await doReject({ data: { token, id } });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete");
    } finally {
      setActing(null);
    }
  };

  const FILTER_TABS: { key: "all" | "pending" | "approved"; label: string }[] = [
    { key: "pending",  label: "Needs Review" },
    { key: "approved", label: "Published" },
    { key: "all",      label: "All Reviews" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Product Reviews</h1>
          <p className="text-[0.68rem] text-gray-400 mt-0.5">
            Approve customer reviews before they appear on product pages
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-[0.60rem] uppercase tracking-[0.14em] text-gray-500 transition-all rounded-lg"
          style={{ background: "white", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Reviews",     value: (data?.reviews ?? []).length > 0 ? String(data!.reviews.length) : "—" },
          { label: "Pending Approval",  value: pendingCount > 0 ? String(pendingCount) : "0", accent: pendingCount > 0 },
          { label: "Published",         value: String((data?.reviews ?? []).filter(r => r.approved).length) },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className="p-4 rounded-xl"
            style={{
              background: accent ? "linear-gradient(135deg,#fffbeb,white)" : "white",
              border: accent ? "1px solid rgba(251,191,36,0.24)" : "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              borderTop: accent ? "3px solid #fbbf24" : "3px solid transparent",
            }}
          >
            <p className="text-[0.55rem] uppercase tracking-[0.22em] font-semibold mb-1.5" style={{ color: accent ? "rgba(180,83,9,0.7)" : "#9ca3af" }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: accent ? "#b45309" : "#111827" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1.5 mb-5 p-1.5 rounded-xl w-fit"
        style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)" }}
      >
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="px-4 py-2 text-[0.62rem] uppercase tracking-[0.12em] font-medium transition-all rounded-lg"
            style={filter === tab.key ? {
              background: "white",
              color: "#111827",
              border: "1px solid rgba(251,191,36,0.22)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            } : {
              color: "#9ca3af",
              border: "1px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: "white", border: "1px solid rgba(0,0,0,0.07)" }}>
          <Star className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {filter === "pending" ? "No reviews waiting for approval" : "No reviews yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div
              key={review.id}
              className="rounded-xl p-5"
              style={{
                background: "white",
                border: review.approved ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(251,191,36,0.20)",
                boxShadow: review.approved ? "0 1px 4px rgba(0,0,0,0.04)" : "0 2px 8px rgba(251,191,36,0.06), 0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <StarDisplay rating={review.rating} />
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.10em] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <ShieldCheck className="h-3 w-3" /> Verified Purchase
                      </span>
                    )}
                    {review.approved ? (
                      <span className="inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.10em] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                        <Check className="h-3 w-3" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.58rem] uppercase tracking-[0.10em] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Review content */}
                  {review.title && (
                    <p className="text-sm font-semibold text-gray-900 mb-1">{review.title}</p>
                  )}
                  <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[0.62rem] text-gray-400">
                    <span className="font-medium text-gray-600">{review.customer_name}</span>
                    <span>·</span>
                    <span>{review.customer_email}</span>
                    {review.order_number && (
                      <>
                        <span>·</span>
                        <span className="font-mono">Order {review.order_number}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                    <span>·</span>
                    <Link
                      to="/product/$slug"
                      params={{ slug: review.product_slug }}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {review.product_slug}
                    </Link>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {!review.approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      disabled={acting === review.id}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-[0.62rem] uppercase tracking-[0.12em] font-medium transition-all rounded-lg disabled:opacity-50"
                      style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid rgba(21,128,61,0.22)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {acting === review.id ? "…" : "Approve"}
                    </button>
                  )}
                  <button
                    onClick={() => handleReject(review.id, review.customer_name)}
                    disabled={acting === review.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-[0.62rem] uppercase tracking-[0.12em] font-medium transition-all rounded-lg disabled:opacity-50"
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid rgba(220,38,38,0.20)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                  >
                    <X className="h-3.5 w-3.5" />
                    {review.approved ? "Delete" : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
