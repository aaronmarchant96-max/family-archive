import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";

export interface ChronologyEntry {
  id: string;
  title: string;
  date: string;
  summary: string;
  confidence: string;
  sourceLabel: string;
  href: string;
  place?: string;
  extra?: string;
}

function timelineSortValue(date: string) {
  const normalized = date.toLowerCase().trim();

  if (normalized === "later generations") {
    return Number.POSITIVE_INFINITY;
  }

  const decadeMatch = normalized.match(/^(\d{3})(\d)s$/);
  if (decadeMatch) {
    return Number.parseInt(`${decadeMatch[1]}${decadeMatch[2]}`, 10);
  }

  const yearMatch = normalized.match(/^(\d{4})$/);
  if (yearMatch) {
    return Number.parseInt(yearMatch[1], 10);
  }

  const dateValue = Date.parse(date);
  return Number.isNaN(dateValue) ? Number.POSITIVE_INFINITY : dateValue;
}

export function sortChronologyEntries(entries: ChronologyEntry[]) {
  return [...entries].sort((a, b) => timelineSortValue(a.date) - timelineSortValue(b.date));
}

export function Chronology({ entries, emptyLabel }: { entries: ChronologyEntry[]; emptyLabel: string }) {
  if (!entries.length) {
    return <div className="archive-empty">{emptyLabel}</div>;
  }

  return (
    <div className="relative pl-4 sm:pl-6">
      <div className="absolute left-1 sm:left-2 top-1 h-full w-px bg-[rgba(18,20,24,0.12)]" aria-hidden="true" />
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="relative">
            <div className="absolute -left-4 sm:-left-6 top-2 h-3 w-3 rounded-full border border-[rgba(127,29,45,0.55)] bg-[rgba(127,29,45,0.8)]" aria-hidden="true" />
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--archive-text)]">{entry.title}</div>
                  <div className="mt-1 text-sm text-[var(--archive-text-soft)]">{entry.date}</div>
                </div>
                <ConfidenceBadge label={entry.confidence} />
              </div>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{entry.sourceLabel}</div>
              <p className="mt-3 text-sm leading-6 text-[var(--archive-text)]">{entry.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--archive-text-soft)]">
                <span>{entry.extra}</span>
                {entry.place ? <span>Place: {entry.place}</span> : null}
              </div>
              <Link
                href={entry.href}
                className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)] hover:text-[var(--archive-accent-soft)]"
              >
                Open record
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
