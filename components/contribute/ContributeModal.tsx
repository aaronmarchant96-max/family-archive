"use client";

import { useState } from "react";

interface ContributeModalProps {
  targetPersonId?: string;
  targetPersonName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContributeModal({
  targetPersonId = "general-archive",
  targetPersonName = "Family Archive",
  isOpen,
  onClose
}: ContributeModalProps) {
  const [contributorName, setContributorName] = useState("");
  const [type, setType] = useState<"story" | "photo" | "correction">("story");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributorName.trim() || !content.trim()) {
      setErrorMessage("Please fill in your name and contribution details.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPersonId,
          contributorName: contributorName.trim(),
          type,
          content: content.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit memory");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setContent("");
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-[2rem] border border-[rgba(18,20,24,0.15)] bg-[#f4efe7] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contribute modal"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(18,20,24,0.08)] text-sm font-semibold text-[var(--archive-text)] transition hover:bg-[rgba(18,20,24,0.16)] active:scale-95"
        >
          ✕
        </button>

        <div className="mb-4">
          <div className="archive-kicker">Family Collaboration</div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
            Contribute to {targetPersonName}
          </h2>
          <p className="mt-1 text-xs text-[var(--archive-text-soft)] leading-relaxed">
            Submit oral stories, historical memories, photograph scans, or record corrections for curator review.
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6 text-center text-emerald-900">
            <div className="text-2xl mb-1">✓</div>
            <div className="font-semibold text-base">Memory Submitted!</div>
            <div className="text-xs text-emerald-700 mt-1">
              Thank you for preserving our family history. Your contribution is queued for archive review.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--archive-accent)] mb-1">
                Your Name / Relation
              </label>
              <input
                type="text"
                value={contributorName}
                onChange={(e) => setContributorName(e.target.value)}
                placeholder="e.g. Aaron Marchant (Grandson)"
                className="w-full rounded-xl border border-[rgba(18,20,24,0.15)] bg-white px-3.5 py-2.5 text-sm text-[var(--archive-text)] outline-none focus:border-[var(--archive-accent)] focus:ring-2 focus:ring-[rgba(127,29,45,0.15)]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--archive-accent)] mb-1">
                Contribution Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["story", "photo", "correction"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-xl border py-2 text-xs font-semibold capitalize transition ${
                      type === t
                        ? "border-[var(--archive-accent)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                        : "border-[rgba(18,20,24,0.1)] bg-white text-[var(--archive-text-soft)] hover:bg-white/80"
                    }`}
                  >
                    {t === "story" ? "📖 Story" : t === "photo" ? "📷 Photo" : "✏️ Correction"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--archive-accent)] mb-1">
                Details & Sources
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === "story"
                    ? "Share an untold memory or story passed down by elders..."
                    : type === "photo"
                    ? "Describe the photo scan, date, location, and who is pictured..."
                    : "Describe what fact/date needs correction and include any source citation..."
                }
                className="w-full rounded-xl border border-[rgba(18,20,24,0.15)] bg-white p-3 text-sm text-[var(--archive-text)] outline-none focus:border-[var(--archive-accent)] focus:ring-2 focus:ring-[rgba(127,29,45,0.15)] leading-relaxed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full border border-[rgba(127,29,45,0.3)] bg-[var(--archive-accent)] py-3 text-center text-xs font-semibold uppercase tracking-widest text-white shadow transition hover:bg-[var(--archive-accent-soft)] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting to Queue..." : "Submit for Family Review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
