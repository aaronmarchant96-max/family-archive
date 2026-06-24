import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";

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
  branch: string;
  summary: string;
  keyEvent: string;
  confidence: string;
  tags?: string[];
  attachedDocument?: string;
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

export function AncestorCard({ id, name, lifespan, branch, summary, keyEvent, confidence, tags, attachedDocument }: AncestorCardProps) {
  return (
    <Link href={`/ancestors/${id}`} className="archive-panel flex flex-col gap-3 transition hover:border-amber-300/40 hover:bg-white/6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">{branch}</div>
        <ConfidenceBadge label={confidence} />
      </div>
      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <div className="text-sm text-slate-300">{lifespan}</div>
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
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/60">Open record preview</div>
    </Link>
  );
}
