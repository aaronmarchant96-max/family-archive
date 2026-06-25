import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourcePreview } from "./SourcePreview";

export interface DocumentCardProps {
  id: string;
  filename: string;
  title?: string;
  type: string;
  date: string;
  dateRange?: string;
  era?: string;
  sourceUrl?: string;
  sourceCitation?: string;
  previewUrl: string;
  confidence: string;
  people: string[];
  place?: string;
  whatItProves: string;
  notes?: string;
}

export function DocumentCard({
  id,
  filename,
  title,
  type,
  date,
  era,
  sourceUrl,
  sourceCitation,
  previewUrl,
  confidence,
  people,
  place,
  whatItProves,
  notes,
  onPreview
}: DocumentCardProps & { onPreview?: () => void }) {
  return (
    <article className="archive-panel flex flex-col gap-4 transition hover:-translate-y-0.5 hover:border-[rgba(127,29,45,0.32)] hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{type}</div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.04)]">
        <SourcePreview src={previewUrl} title={filename} className="h-44 w-full" />
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">{title || filename}</h3>
      <div className="text-sm text-[var(--archive-text-soft)]">{date}</div>
      {era ? <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent-soft)]">{era}</div> : null}
      {people.length ? <div className="text-sm text-[var(--archive-text-soft)]">People: {people.join(", ")}</div> : null}
      {place ? <div className="text-sm text-[var(--archive-text-soft)]">Place: {place}</div> : null}
      {(sourceUrl || sourceCitation) ? (
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-xs leading-5 text-[var(--archive-text-soft)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Source citation</div>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex underline decoration-[rgba(127,29,45,0.35)] underline-offset-4 hover:text-[var(--archive-accent)]"
            >
              {sourceCitation ?? sourceUrl}
            </a>
          ) : (
            <div className="mt-1 text-[var(--archive-text)]">{sourceCitation}</div>
          )}
        </div>
      ) : null}
      <div className="rounded-2xl border border-[rgba(127,29,45,0.12)] bg-[rgba(127,29,45,0.05)] p-3 text-sm text-[var(--archive-text)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">What this record shows about the family</div>
        <div className="mt-1 leading-6">{whatItProves}</div>
      </div>
      {notes ? <div className="text-xs leading-5 text-[var(--archive-text-soft)]">{notes}</div> : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/documents/${id}`}
          className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-text)] hover:border-[rgba(127,29,45,0.35)] hover:bg-white"
        >
          View record details
        </Link>
        <button
          type="button"
          onClick={onPreview}
          className="rounded-full border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)] hover:border-[rgba(127,29,45,0.35)] hover:bg-[rgba(127,29,45,0.08)]"
        >
          Open private preview
        </button>
      </div>
    </article>
  );
}
