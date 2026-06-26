"use client";

import { useMemo, useState } from "react";
import { AncestorCard, type AncestorCardProps } from "./AncestorCard";
import { Chronology, sortChronologyEntries } from "./Chronology";
import { RecordPreviewModal } from "./RecordPreviewModal";
import documentsData from "../data/documents.json";

const documents = documentsData as Array<{ filename: string; previewUrl?: string }>;

function findPreviewUrl(person: AncestorCardProps) {
  const match = documents.find((document) => document.filename.toLowerCase() === person.attachedDocument?.toLowerCase());
  return match?.previewUrl;
}

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

function matchesQuery(person: AncestorCardProps, query: string) {
  if (!query) {
    return true;
  }
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const haystack = [
    person.name,
    person.lifespan,
    person.era,
    person.branch,
    person.summary,
    person.keyEvent,
    person.confidence,
    person.attachedDocument,
    person.sourceUrl,
    person.sourceCitation,
    ...(person.tags ?? []),
    ...(person.timeline ?? []).flatMap((entry) => [entry.title, entry.date, entry.summary, entry.place, entry.confidence, entry.linkedDocumentId]),
    ...(person.evidenceSummary ?? []),
    person.sarLineStatus?.status,
    person.sarLineStatus?.note
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return tokens.every(token => haystack.includes(token));
}

export function AncestorsBrowser({ people }: { people: AncestorCardProps[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [previewPerson, setPreviewPerson] = useState<AncestorCardProps | null>(null);

  const vocab = useMemo(() => {
    const set = new Set<string>();
    people.forEach((p) => {
      const text = [
        p.name, p.lifespan, p.era, p.branch, p.summary, p.keyEvent, p.confidence, p.attachedDocument, p.sourceUrl, p.sourceCitation,
        ...(p.tags ?? []),
        ...(p.timeline ?? []).flatMap(e => [e.title, e.date, e.summary, e.place]),
        ...(p.evidenceSummary ?? []),
        p.sarLineStatus?.status, p.sarLineStatus?.note
      ].filter(Boolean).join(" ").toLowerCase();
      text.split(/[\s,.-]+/).forEach(w => { if (w.length > 2) set.add(w); });
    });
    return Array.from(set);
  }, [people]);

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return people.filter((person) => matchesQuery(person, normalized));
  }, [people, query]);

  const suggestion = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || filteredPeople.length > 0) return null;
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
  }, [query, vocab, filteredPeople.length]);

  const peopleWithPreviews = useMemo(
    () =>
      filteredPeople.map((person) => ({
        ...person,
        previewUrl: findPreviewUrl(person),
        previewLabel: person.attachedDocument ?? person.name
      })),
    [filteredPeople]
  );

  const chronologyEntries = useMemo(() => {
    return sortChronologyEntries(
      filteredPeople.flatMap((person) =>
        (person.timeline ?? []).map((entry, index) => ({
          id: `${person.id}-${entry.title}-${entry.date}-${index}`,
          title: `${person.name} · ${entry.title}`,
          date: entry.date,
          summary: entry.summary,
          confidence: entry.confidence,
          sourceLabel: person.branch,
          href: `/ancestors/${person.id}`,
          place: entry.place,
          extra: entry.linkedDocumentId ? `Linked document: ${entry.linkedDocumentId}` : `Ancestor: ${person.name}`
        }))
      )
    );
  }, [filteredPeople]);

  return (
    <div className="flex flex-col gap-6">
      <div className="archive-panel space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="archive-kicker">Documented lines</div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">Ancestor cards</h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
              Search by name, era, branch, tag, or note. Switch to timeline view to read the family record in
              chronological order.
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
          <span className="sr-only">Search ancestors</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ancestors by name, era, branch, tag, or note"
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
      </div>

      {viewMode === "cards" ? (
        <div className="archive-grid">
          {peopleWithPreviews.length ? (
            peopleWithPreviews.map((person) => (
              <AncestorCard key={person.id} {...person} onPreview={() => setPreviewPerson(person)} />
            ))
          ) : (
            <div className="archive-empty">
              No ancestor records match this search. Try a branch name, tag, or era like Revolutionary War or Civil
              War.
            </div>
          )}
        </div>
      ) : (
        <section className="archive-panel space-y-4">
          <div className="archive-section__title">Chronological view</div>
          <p className="text-sm leading-6 text-[var(--archive-text-soft)]">
            Timeline events from the filtered ancestors, ordered by date. This is a reading view, not a proof
            verdict.
          </p>
          <Chronology
            entries={chronologyEntries}
            emptyLabel="No timeline events match this search. Try clearing the search or switching back to cards."
          />
        </section>
      )}

      <RecordPreviewModal
        item={previewPerson ? { kind: "ancestor", person: previewPerson } : null}
        onClose={() => setPreviewPerson(null)}
      />
    </div>
  );
}
