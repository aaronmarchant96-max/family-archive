"use client";

import { useEffect, useState } from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { AncestorCardProps } from "./AncestorCard";
import type { DocumentCardProps } from "./DocumentCard";
import { SourcePreview } from "./SourcePreview";
import documentsData from "../data/documents.json";

const documents = documentsData as Array<{ filename: string; previewUrl?: string; id: string }>;

type PreviewItem =
  | { kind: "ancestor"; person: AncestorCardProps }
  | { kind: "document"; document: DocumentCardProps };

export function RecordPreviewModal({
  item,
  onClose
}: {
  item: PreviewItem | null;
  onClose: () => void;
}) {
  const [scanNoticeVisible, setScanNoticeVisible] = useState(false);

  useEffect(() => {
    setScanNoticeVisible(false);

    if (!item) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const title = item.kind === "ancestor" ? item.person.name : item.document.filename;
  const confidence = item.kind === "ancestor" ? item.person.confidence : item.document.confidence;
  const attachedDocument = item.kind === "ancestor" ? item.person.attachedDocument : undefined;
  const attachedSource = attachedDocument
    ? documents.find((document) => document.filename.toLowerCase() === attachedDocument.toLowerCase())
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-preview-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-[rgba(18,20,24,0.08)] bg-[#f4efe7] p-6 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[rgba(18,20,24,0.08)] pb-4">
          <div>
            <div className="archive-kicker">Private record preview</div>
            <h2 id="record-preview-title" className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ConfidenceBadge label={confidence} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 text-lg font-medium text-[var(--archive-text)] transition hover:bg-white hover:border-[rgba(127,29,45,0.4)]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {item.kind === "ancestor" ? (
            <>
              <Info label="Branch" value={item.person.branch} />
              <Info label="Era" value={item.person.era ?? item.person.lifespan} />
              <Info label="Lifespan" value={item.person.lifespan} />
              <Info label="Attached record" value={item.person.attachedDocument ?? "Not listed"} />
              <Info label="Key event" value={item.person.keyEvent} wide />
              <Info label="Summary" value={item.person.summary} wide />
              <Info
                label="Tags"
                value={item.person.tags?.length ? item.person.tags.join(", ") : "Not listed"}
                wide
              />
              <Info
                label="Source citation"
                value={
                  item.person.sourceCitation ??
                  (item.person.sourceUrl ?? "Not listed")
                }
                wide
              />
              {item.person.portraitUrl ? (
                <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Portrait
                  </div>
                  <SourcePreview src={item.person.portraitUrl} title={item.person.portraitCaption ?? item.person.name} className="h-[28rem] w-full rounded-xl" />
                  {item.person.portraitCaption ? (
                    <div className="mt-2 text-xs text-slate-500">{item.person.portraitCaption}</div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <Info label="Filename" value={item.document.filename} />
              <Info label="Type" value={item.document.type} />
              <Info label="Date" value={item.document.date} />
              <Info label="Place" value={item.document.place ?? "Not listed"} />
              <Info
                label="People"
                value={item.document.people.length ? item.document.people.join(", ") : "Not listed"}
                wide
              />
              <Info label="What it proves" value={item.document.fact && item.document.meaning ? `${item.document.fact} ${item.document.meaning}` : (item.document.whatItProves ?? "Not listed")} wide />
              <Info label="Notes" value={item.document.notes ?? "Not listed"} wide />
              <Info
                label="Source citation"
                value={
                  item.document.sourceCitation ??
                  (item.document.sourceUrl ?? "Not listed")
                }
                wide
              />
            </>
          )}
        </div>

        {item.kind === "document" ? (
          <div className="mt-5 rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">
              Primary source scan
            </div>
            <SourcePreview src={item.document.previewUrl} title={item.document.filename} className="h-[28rem] w-full rounded-xl" />
          </div>
        ) : attachedSource?.previewUrl ? (
          <div className="mt-5 rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">
              Primary source scan
            </div>
            <SourcePreview src={attachedSource.previewUrl} title={attachedDocument ?? item.person.name} className="h-[28rem] w-full rounded-xl" />
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-dashed border-[rgba(127,29,45,0.18)] bg-[rgba(127,29,45,0.05)] p-4 text-sm leading-6 text-[var(--archive-text)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">
            Private / local-only notice
          </div>
          <p className="mt-2">
            The archive keeps the source file with the record. This preview shows the metadata and the source scan
            together.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
            onClick={() => setScanNoticeVisible(true)}
              className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-text)]"
            >
              Open private scan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)]"
            >
              Close
            </button>
          </div>
          {scanNoticeVisible ? (
            <div className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-100/80">
              Private file - stored securely.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 text-sm text-[var(--archive-text)] ${wide ? "md:col-span-2" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{label}</div>
      <div className="mt-1 leading-6">{value}</div>
    </div>
  );
}
