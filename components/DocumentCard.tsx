import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourcePreview } from "./SourcePreview";

export interface DocumentCardProps {
  id: string;
  filename: string;
  type: string;
  date: string;
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
    <article className="archive-panel flex flex-col gap-3 transition hover:border-amber-300/40 hover:bg-white/6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">{type}</div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        <SourcePreview src={previewUrl} title={filename} className="h-44 w-full" />
      </div>
      <h3 className="text-lg font-semibold text-white">{filename}</h3>
      <div className="text-sm text-slate-300">{date}</div>
      {era ? <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{era}</div> : null}
      {people.length ? <div className="text-sm text-slate-400">People: {people.join(", ")}</div> : null}
      {place ? <div className="text-sm text-slate-400">Place: {place}</div> : null}
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
      <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-3 text-sm text-slate-300">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/80">What it proves</div>
        <div className="mt-1 leading-6 text-slate-100">{whatItProves}</div>
      </div>
      {notes ? <div className="text-xs leading-5 text-slate-500">{notes}</div> : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href={`/documents/${id}`}
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
