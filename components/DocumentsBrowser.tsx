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

  const sortedDocuments = useMemo(() => {
    const isScreenshot = (d: DocumentCardProps) => {
      const hay = `${d.type} ${d.filename} ${d.previewUrl || ''}`.toLowerCase();
      return hay.includes('.png') || /grave|plaque|screenshot|marker|memorial|photo/.test(hay);
    };
    return [...filteredDocuments].sort((a, b) => {
      const aShot = isScreenshot(a) ? 0 : 1;
      const bShot = isScreenshot(b) ? 0 : 1;
      if (aShot !== bShot) return aShot - bShot;
      return 0; // preserve original relative order for non-screenshots
    });
  }, [filteredDocuments]);

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
            <div className="archive-kicker">Family documents</div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">Our family documents</h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
              Search for people, places, or types of records. You can also switch to timeline view to see everything
              in date order.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`rounded-full border px-4 py-2 text-sm ${
                viewMode === "cards"
                  ? "border-[rgba(127,29,45,0.35)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                  : "border-[rgba(18,20,24,0.08)] bg-white/60 text-[var(--archive-text)] hover:bg-white"
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`rounded-full border px-4 py-2 text-sm ${
                viewMode === "timeline"
                  ? "border-[rgba(127,29,45,0.35)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                  : "border-[rgba(18,20,24,0.08)] bg-white/60 text-[var(--archive-text)] hover:bg-white"
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
            placeholder="Search by person, place, year, or type of record"
            className="w-full rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/70 px-4 py-3 text-sm text-[var(--archive-text)] outline-none placeholder:text-[var(--archive-text-soft)] focus:border-[rgba(127,29,45,0.4)]"
          />
        </label>
      </div>

      {viewMode === "cards" ? (
        <div className="archive-grid">
          {sortedDocuments.length ? (
            sortedDocuments.map((document) => (
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
          <p className="text-sm leading-6 text-[var(--archive-text-soft)]">
            Records arranged by their date field, so you can scan the archive as a timeline instead of as cards.
          </p>
          <Chronology
            entries={chronologyEntries}
            emptyLabel="No document records match this search. Try clearing the search or switching back to cards."
          />
        </section>
      )}

      <div className="text-xs text-[var(--archive-text-soft)] mt-2">
        Labels we use: “Strong original document” means we have the actual paper or scan. “Very reliable” means
        good supporting evidence. “Trusted family story” comes from people who were there.
      </div>

      <RecordPreviewModal
        item={previewDocument ? { kind: "document", document: previewDocument } : null}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}
