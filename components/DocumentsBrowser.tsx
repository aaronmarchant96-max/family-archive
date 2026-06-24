"use client";

import { useMemo, useState } from "react";
import { DocumentCard, type DocumentCardProps } from "./DocumentCard";
import { Chronology, sortChronologyEntries } from "./Chronology";
import { RecordPreviewModal } from "./RecordPreviewModal";

type ViewMode = "cards" | "timeline";

function matchesQuery(document: DocumentCardProps, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    document.filename,
    document.type,
    document.date,
    document.era,
    document.place,
    document.confidence,
    document.whatItProves,
    document.notes,
    ...(document.people ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function DocumentsBrowser({ documents }: { documents: DocumentCardProps[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [previewDocument, setPreviewDocument] = useState<DocumentCardProps | null>(null);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => matchesQuery(document, normalized));
  }, [documents, query]);

  const chronologyEntries = useMemo(() => {
    return sortChronologyEntries(
      filteredDocuments.map((document, index) => ({
        id: `${document.id}-${index}`,
        title: document.filename,
        date: document.date,
        summary: document.whatItProves,
        confidence: document.confidence,
        sourceLabel: document.type,
        href: `/documents/${document.id}`,
        place: document.place,
        extra: document.people.length ? `People: ${document.people.join(", ")}` : "Metadata-only record"
      }))
    );
  }, [filteredDocuments]);

  return (
    <div className="flex flex-col gap-6">
      <div className="archive-panel space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="archive-kicker">Documents</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Document previews</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
              Search by filename, era, person, type, place, or proof note. Switch to timeline view to see the record
              set in date order.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-full border px-4 py-2 text-sm ${
                viewMode === "cards"
                  ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`rounded-full border px-4 py-2 text-sm ${
                viewMode === "timeline"
                  ? "border-amber-300/40 bg-amber-300/10 text-amber-100"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        <label className="block">
          <span className="sr-only">Search documents</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents by filename, era, person, place, type, or note"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/40"
          />
        </label>
      </div>

      {viewMode === "cards" ? (
        <div className="archive-grid">
          {filteredDocuments.length ? (
            filteredDocuments.map((document) => (
              <DocumentCard key={document.id} {...document} onPreview={() => setPreviewDocument(document)} />
            ))
          ) : (
            <div className="archive-empty">
              No document records match this search. Try a filename, era, person, or note keyword.
            </div>
          )}
        </div>
      ) : (
        <section className="archive-panel space-y-4">
          <div className="archive-section__title">Chronological view</div>
          <p className="text-sm leading-6 text-slate-400">
            Records arranged by their date field, so you can scan the archive as a timeline instead of as cards.
          </p>
          <Chronology
            entries={chronologyEntries}
            emptyLabel="No document records match this search. Try clearing the search or switching back to cards."
          />
        </section>
      )}

      <RecordPreviewModal
        item={previewDocument ? { kind: "document", document: previewDocument } : null}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}
