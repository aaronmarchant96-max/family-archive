"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Contribution } from "../../../lib/contributionStore";

export default function ContributionReviewPage() {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionMessage, setActionMessage] = useState("");

  const fetchContributions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/contribute");
      const data = await res.json();
      if (data.success && Array.isArray(data.contributions)) {
        setContributions(data.contributions);
      }
    } catch {
      // Fetch error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    try {
      // In-browser optimistic update
      setContributions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      setActionMessage(`Contribution marked as ${status}!`);
      setTimeout(() => setActionMessage(""), 2500);
    } catch {
      // Status update error
    }
  };

  const filtered = contributions.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="archive-panel space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="archive-kicker">Curator Dashboard</div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
              Family Contributions Queue
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--archive-text-soft)]">
              Review, approve, and verify oral stories, photo scans, and corrections submitted by family members.
            </p>
          </div>
          <Link
            href="/tree"
            className="rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 px-4 py-2 text-xs font-semibold text-[var(--archive-text)] shadow-sm hover:bg-white self-start sm:self-auto"
          >
            ← Back to Family Tree
          </Link>
        </div>

        {actionMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-medium text-emerald-900">
            {actionMessage}
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => {
            const count =
              f === "all"
                ? contributions.length
                : contributions.filter((c) => c.status === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3.5 py-1 text-xs font-semibold capitalize transition ${
                  filter === f
                    ? "border-[var(--archive-accent)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                    : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)] hover:bg-white"
                }`}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-white/10 bg-[#12151a] p-12 text-center text-sm text-[#e1d8cb]/60">
          Loading contributions queue...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#12151a] p-12 text-center text-sm text-[#e1d8cb]/70">
          No {filter !== "all" ? filter : ""} submissions in the queue.
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-[rgba(18,20,24,0.12)] bg-[#f4efe7] p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(18,20,24,0.08)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--archive-accent)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--archive-accent)] uppercase">
                    {item.type}
                  </span>
                  <span className="font-semibold text-sm text-[var(--archive-text)]">
                    Target: {item.targetPersonId}
                  </span>
                </div>
                <div className="text-xs text-[var(--archive-text-soft)]">
                  By <strong className="text-[var(--archive-text)]">{item.contributorName}</strong> on{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[var(--archive-text)] whitespace-pre-wrap">
                {item.content}
              </p>

              <div className="flex items-center justify-between pt-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    item.status === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : item.status === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  Status: {item.status}
                </span>

                {item.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(item.id, "approved")}
                      className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 active:scale-95"
                    >
                      ✓ Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(item.id, "rejected")}
                      className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 active:scale-95"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
