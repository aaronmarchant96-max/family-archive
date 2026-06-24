"use client";

import { useEffect, useState } from "react";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { AncestorCardProps } from "./AncestorCard";
import type { DocumentCardProps } from "./DocumentCard";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-preview-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="archive-kicker">Record preview</div>
            <h2 id="record-preview-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              {title}
            </h2>
          </div>
          <ConfidenceBadge label={confidence} />
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
              <Info label="What it proves" value={item.document.whatItProves} wide />
              <Info label="Notes" value={item.document.notes ?? "Not listed"} wide />
            </>
          )}
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-slate-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/80">
            Private / local-only notice
          </div>
          <p className="mt-2">
            The original scan is stored separately and is not publicly exposed. This preview shows metadata only.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setScanNoticeVisible(true)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200"
            >
              View / Download full scan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80"
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
    <div className={`rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 ${wide ? "md:col-span-2" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-1 leading-6 text-slate-100">{value}</div>
    </div>
  );
}
