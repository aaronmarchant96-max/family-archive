import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { TimelineEntry } from "./AncestorCard";

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-1 h-full w-px bg-white/10" aria-hidden="true" />
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={`${entry.date}-${entry.title}`} className="relative">
            <div className="absolute -left-6 top-2 h-3 w-3 rounded-full border border-amber-300/50 bg-amber-200/80" aria-hidden="true" />
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{entry.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{entry.date}</div>
                </div>
                <ConfidenceBadge label={entry.confidence} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{entry.summary}</p>
              {entry.place ? <div className="mt-2 text-xs text-slate-500">Place: {entry.place}</div> : null}
              {entry.linkedDocumentId ? (
                <div className="mt-3">
                  <Link
                    href={`/documents/${entry.linkedDocumentId}`}
                    className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70 hover:text-amber-100"
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
