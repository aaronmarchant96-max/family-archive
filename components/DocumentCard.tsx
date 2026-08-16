"use client";

import { useState } from "react";
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
  whatItProves?: string;
  fact?: string;
  meaning?: string;
  notes?: string;
  branch?: string;
  researchPriority?: string | boolean;
  seeAlso?: string[];
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
  fact,
  meaning,
  notes,
  branch,
  researchPriority,
  seeAlso,
  onPreview
}: DocumentCardProps & { onPreview?: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCitation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = sourceCitation || sourceUrl || filename;
    if (textToCopy && navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className="archive-panel flex flex-col gap-4 transition hover:-translate-y-0.5 hover:border-[rgba(127,29,45,0.32)] hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{type}</div>
        <ConfidenceBadge label={confidence} />
      </div>

      <div
        onClick={onPreview}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.04)]"
      >
        <SourcePreview src={previewUrl} title={filename} className="h-48 w-full transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[var(--archive-text)] shadow">
            Click to expand scan
          </span>
        </div>
      </div>

      <h3 className="text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">{title || filename}</h3>
      <div className="text-sm text-[var(--archive-text-soft)]">{date}</div>
      {era ? <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent-soft)]">{era}</div> : null}
      {people.length ? <div className="text-sm text-[var(--archive-text-soft)]">People: {people.join(", ")}</div> : null}
      {place ? <div className="text-sm text-[var(--archive-text-soft)]">Place: {place}</div> : null}
      {branch ? <div className="text-sm text-[var(--archive-text-soft)]">Branch: <span className="font-medium text-[var(--archive-accent)]">{branch}</span></div> : null}

      {(sourceUrl || sourceCitation) ? (
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3.5 text-xs leading-5 text-[var(--archive-text-soft)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Source citation</span>
            <button
              type="button"
              onClick={handleCopyCitation}
              className="text-[10px] font-medium uppercase tracking-wider text-[var(--archive-accent)] hover:underline"
            >
              {copied ? "✓ Copied!" : "Copy citation"}
            </button>
          </div>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex underline decoration-[rgba(127,29,45,0.35)] underline-offset-4 hover:text-[var(--archive-accent)]"
            >
              {sourceCitation ?? sourceUrl}
            </a>
          ) : (
            <div className="mt-1.5 text-[var(--archive-text)]">{sourceCitation}</div>
          )}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[rgba(127,29,45,0.12)] bg-[rgba(127,29,45,0.05)] p-3.5 text-sm text-[var(--archive-text)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">What this record shows about the family</div>
        {fact && meaning ? (
          <div className="mt-1.5 leading-6 space-y-1.5">
            <div><strong className="font-semibold text-[var(--archive-accent)]">Fact:</strong> {fact}</div>
            <div><strong className="font-semibold text-[var(--archive-accent)]">Meaning:</strong> {meaning}</div>
          </div>
        ) : (
          <div className="mt-1.5 leading-6">{whatItProves}</div>
        )}
      </div>

      {researchPriority ? (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
          <strong>Research Priority:</strong> {typeof researchPriority === 'string' ? researchPriority : 'Verify details from original sources.'}
        </div>
      ) : null}

      {notes ? <div className="text-xs leading-5 text-[var(--archive-text-soft)]">{notes}</div> : null}

      {seeAlso && seeAlso.length > 0 ? (
        <div className="text-xs text-[var(--archive-text-soft)]">
          See also: {seeAlso.map((id, idx) => (
            <span key={idx}>
              {idx > 0 ? ', ' : ''}
              <Link href={`/documents/${id}`} className="underline hover:text-[var(--archive-accent)]">{id}</Link>
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-[rgba(18,20,24,0.06)]">
        <Link
          href={`/documents/${id}`}
          className="flex-1 min-w-[130px] rounded-full border border-[rgba(18,20,24,0.12)] bg-white/70 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--archive-text)] transition hover:border-[rgba(127,29,45,0.4)] hover:bg-white shadow-sm"
        >
          View record details
        </Link>
        <button
          type="button"
          onClick={onPreview}
          className="flex-1 min-w-[130px] rounded-full border border-[rgba(127,29,45,0.25)] bg-[rgba(127,29,45,0.06)] px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--archive-accent)] transition hover:border-[rgba(127,29,45,0.45)] hover:bg-[rgba(127,29,45,0.12)] shadow-sm"
        >
          Open private preview
        </button>
      </div>
    </article>
  );
}
