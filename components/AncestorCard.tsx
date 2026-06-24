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
  previewUrl,
  previewLabel,
  portraitUrl,
  portraitCaption,
  onPreview
}: AncestorCardProps & { previewUrl?: string; previewLabel?: string; portraitUrl?: string; portraitCaption?: string; onPreview?: () => void }) {
  return (
    <article className="archive-panel flex flex-col gap-3 transition hover:border-amber-300/40 hover:bg-white/6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">{branch}</div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        <SourcePreview
          src={portraitUrl ?? previewUrl}
          title={portraitCaption ?? previewLabel ?? attachedDocument ?? name}
          className="h-44 w-full"
        />
      </div>
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <div className="text-sm text-slate-300">{lifespan}</div>
      {era ? <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{era}</div> : null}
      <p className="text-sm leading-6 text-slate-400">{summary}</p>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Key event</div>
        <div className="mt-1 leading-6 text-slate-200">{keyEvent}</div>
      </div>
      {tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {attachedDocument ? <div className="text-xs text-slate-500">Attached record: {attachedDocument}</div> : null}
      {(sourceUrl || sourceCitation) ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Source citation</div>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex text-amber-200/80 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-100"
            >
              {sourceCitation ?? sourceUrl}
            </a>
          ) : (
            <div className="mt-1 text-slate-100">{sourceCitation}</div>
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/ancestors/${id}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100"
        >
          Open detail
        </Link>
        <button
          type="button"
          onClick={onPreview}
          className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80 hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100"
        >
          Open record preview
        </button>
      </div>
    </article>
  );
}
