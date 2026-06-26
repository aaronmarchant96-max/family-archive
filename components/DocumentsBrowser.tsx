"use client";

import { useMemo, useState } from "react";
import { DocumentCard, type DocumentCardProps } from "./DocumentCard";
import { Chronology, sortChronologyEntries } from "./Chronology";
import { RecordPreviewModal } from "./RecordPreviewModal";

type ViewMode = "cards" | "timeline";

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function matchesQuery(document: DocumentCardProps, query: string) {
  if (!query) {
    return true;
  }
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

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

  return tokens.every(token => haystack.includes(token));
}

export function DocumentsBrowser({ documents }: { documents: DocumentCardProps[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [filterType, setFilterType] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [previewDocument, setPreviewDocument] = useState<DocumentCardProps | null>(null);

  const uniqueTypes = useMemo(() => Array.from(new Set(documents.map(d => d.type))).sort(), [documents]);
  const uniqueBranches = useMemo(() => Array.from(new Set(documents.map(d => d.branch).filter(Boolean))).sort() as string[], [documents]);

  const vocab = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((doc) => {
      const text = [
        doc.filename,
        doc.type,
        doc.place,
        doc.era,
        doc.confidence,
        ...(doc.people ?? []),
        doc.whatItProves,
        doc.notes
      ].filter(Boolean).join(" ").toLowerCase();
      text.split(/[\s,.-]+/).forEach(w => {
        if (w.length > 2) set.add(w);
      });
    });
    return Array.from(set);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return documents.filter((document) => {
      if (!matchesQuery(document, normalized)) return false;
      if (filterType && document.type !== filterType) return false;
      if (filterBranch && document.branch !== filterBranch) return false;
      return true;
    });
  }, [documents, query, filterType, filterBranch]);

  const suggestion = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || filteredDocuments.length > 0) return null;
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return null;
    if (tokens.length === 1) {
      let best: string | null = null;
      let bestDist = 3;
      for (const term of vocab) {
        const dist = levenshtein(normalized, term);
        if (dist > 0 && dist < bestDist) {
          bestDist = dist;
          best = term;
        }
      }
      return best;
    } else {
      // correct the last token
      const last = tokens[tokens.length - 1];
      let bestLast: string | null = null;
      let bestDist = 3;
      for (const term of vocab) {
        const dist = levenshtein(last, term);
        if (dist > 0 && dist < bestDist) {
          bestDist = dist;
          bestLast = term;
        }
      }
      if (bestLast) {
        return [...tokens.slice(0, -1), bestLast].join(" ");
      }
    }
    return null;
  }, [query, vocab, filteredDocuments.length]);

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
        summary: document.fact && document.meaning ? `${document.fact} ${document.meaning}` : (document.whatItProves || ""),
        confidence: document.confidence,
        sourceLabel: document.type,
        href: `/documents/${document.id}`,
        place: document.place,
        extra: [
          document.people.length ? `People: ${document.people.join(", ")}` : "",
          document.branch ? `Branch: ${document.branch}` : ""
        ].filter(Boolean).join(" · ") || "Metadata-only record"
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

        {suggestion && (
          <div className="text-sm text-[var(--archive-text-soft)] mt-1">
            Did you mean{" "}
            <button
              onClick={() => setQuery(suggestion)}
              className="underline text-[var(--archive-accent)] hover:text-[var(--archive-accent-soft)]"
            >
              {suggestion}
            </button>
            ?
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1.5 text-sm text-[var(--archive-text)]"
          >
            <option value="">All Record Types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="rounded-xl border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1.5 text-sm text-[var(--archive-text)]"
          >
            <option value="">All Branches</option>
            {uniqueBranches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {(filterType || filterBranch) && (
            <button onClick={() => { setFilterType(""); setFilterBranch(""); }} className="text-xs underline text-[var(--archive-accent)]">Clear filters</button>
          )}
        </div>
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
