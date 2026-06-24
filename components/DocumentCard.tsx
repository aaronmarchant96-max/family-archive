import Image from "next/image";
import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";

export interface DocumentCardProps {
  id: string;
  filename: string;
  type: string;
  date: string;
  previewUrl: string;
  confidence: string;
  people: string[];
  place?: string;
  whatItProves: string;
  notes?: string;
}

export function DocumentCard({ id, filename, type, date, previewUrl, confidence, people, place, whatItProves }: DocumentCardProps) {
  return (
    <Link href={`/documents/${id}`} className="archive-panel flex flex-col gap-3 transition hover:border-amber-300/40 hover:bg-white/6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">{type}</div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
        {previewUrl ? (
          <Image src={previewUrl} alt={filename} width={800} height={440} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-sm text-slate-500">
            Scan preview
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-white">{filename}</h3>
      <div className="text-sm text-slate-300">{date}</div>
      {people.length ? <div className="text-sm text-slate-400">People: {people.join(", ")}</div> : null}
      {place ? <div className="text-sm text-slate-400">Place: {place}</div> : null}
      <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">What it proves</div>
        <div className="mt-1 leading-6 text-slate-200">{whatItProves}</div>
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/60">Open record preview</div>
    </Link>
  );
}
