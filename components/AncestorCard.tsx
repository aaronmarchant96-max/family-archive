import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourcePreview } from "./SourcePreview";

export interface TimelineEntry {
  title: string;
  date: string;
  summary: string;
  confidence: string;
  linkedDocumentId?: string;
  place?: string;
}

export interface AncestorCardProps {
  id: string;
  name: string;
  lifespan: string;
  era?: string;
  branch: string;
  summary: string;
  keyEvent: string;
  confidence: string;
  tags?: string[];
  attachedDocument?: string;
  sourceUrl?: string;
  sourceCitation?: string;
  portraitUrl?: string;
  portraitCaption?: string;
  timeline?: TimelineEntry[];
  evidenceSummary?: string[];
  sarLineStatus?: {
    patriotAncestor: string;
    service: string;
    keyRecord: string;
    status: string;
    note: string;
  };
}

export function AncestorCard({
  id,
  name,
  lifespan,
  era,
  branch,
  summary,
  keyEvent,
  confidence,
  tags,
  attachedDocument,
  sourceUrl,
  sourceCitation,
  evidenceSummary,
  previewUrl,
  previewLabel,
  portraitUrl,
  portraitCaption,
  onPreview
}: AncestorCardProps & { previewUrl?: string; previewLabel?: string; portraitUrl?: string; portraitCaption?: string; onPreview?: () => void }) {
  return (
    <article className="archive-panel flex flex-col gap-4 transition hover:-translate-y-0.5 hover:border-[rgba(127,29,45,0.32)] hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{branch}</div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        <SourcePreview
          src={portraitUrl ?? previewUrl}
          title={portraitCaption ?? previewLabel ?? attachedDocument ?? name}
          className="h-44 w-full"
        />
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">{name}</h3>
      <div className="text-sm text-[var(--archive-text-soft)]">{lifespan}</div>
      {era ? <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent-soft)]">{era}</div> : null}
      <p className="text-sm leading-6 text-[var(--archive-text-soft)] line-clamp-3">{summary}</p>
      <div className="border-t border-[rgba(18,20,24,0.08)] pt-4 text-sm text-[var(--archive-text)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Key event</div>
        <div className="mt-1 leading-6">{keyEvent}</div>
      </div>
      {evidenceSummary?.length ? (
        <div className="rounded-2xl border border-[rgba(127,29,45,0.12)] bg-[rgba(127,29,45,0.05)] p-3 text-sm text-[var(--archive-text)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Proof anchor</div>
          <div className="mt-1 leading-6">{evidenceSummary[0]}</div>
        </div>
      ) : null}
      {tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] px-3 py-1 text-xs text-[var(--archive-text-soft)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {attachedDocument ? <div className="text-xs text-[var(--archive-text-soft)]">Attached record: {attachedDocument}</div> : null}
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
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/ancestors/${id}`}
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
