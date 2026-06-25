import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { TimelineEntry } from "./AncestorCard";

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="relative pl-4 sm:pl-6">
      <div className="absolute left-1 sm:left-2 top-1 h-full w-px bg-[rgba(18,20,24,0.12)]" aria-hidden="true" />
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={`${entry.date}-${entry.title}`} className="relative">
            <div className="absolute -left-4 sm:-left-6 top-2 h-3 w-3 rounded-full border border-[rgba(127,29,45,0.55)] bg-[rgba(127,29,45,0.8)]" aria-hidden="true" />
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--archive-text)]">{entry.title}</div>
                  <div className="mt-1 text-sm text-[var(--archive-text-soft)]">{entry.date}</div>
                </div>
                <ConfidenceBadge label={entry.confidence} />
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--archive-text)]">{entry.summary}</p>
              {entry.place ? <div className="mt-2 text-xs text-[var(--archive-text-soft)]">Place: {entry.place}</div> : null}
              {entry.linkedDocumentId ? (
                <div className="mt-3">
                  <Link
                    href={`/documents/${entry.linkedDocumentId}`}
                    className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)] hover:text-[var(--archive-accent-soft)]"
                  >
                    Linked document
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
