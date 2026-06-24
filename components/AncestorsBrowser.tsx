"use client";

import { useMemo, useState } from "react";
import { AncestorCard, type AncestorCardProps } from "./AncestorCard";
import { Chronology, sortChronologyEntries } from "./Chronology";

type ViewMode = "cards" | "timeline";

function matchesQuery(person: AncestorCardProps, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    person.name,
    person.lifespan,
    person.era,
    person.branch,
    person.summary,
    person.keyEvent,
    person.confidence,
    person.attachedDocument,
    ...(person.tags ?? []),
    ...(person.timeline ?? []).flatMap((entry) => [entry.title, entry.date, entry.summary, entry.place, entry.confidence, entry.linkedDocumentId]),
    ...(person.evidenceSummary ?? []),
    person.sarLineStatus?.status,
    person.sarLineStatus?.note
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function AncestorsBrowser({ people }: { people: AncestorCardProps[] }) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const filteredPeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return people.filter((person) => matchesQuery(person, normalized));
  }, [people, query]);

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
            <div className="archive-kicker">Ancestors</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Ancestor cards</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">
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
          <span className="sr-only">Search ancestors</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ancestors by name, era, branch, tag, or note"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/40"
          />
        </label>
      </div>

      {viewMode === "cards" ? (
        <div className="archive-grid">
          {filteredPeople.length ? (
            filteredPeople.map((person) => <AncestorCard key={person.id} {...person} />)
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
          <p className="text-sm leading-6 text-slate-400">
            Timeline events from the filtered ancestors, ordered by date. This is a reading view, not a proof
            verdict.
          </p>
          <Chronology
            entries={chronologyEntries}
            emptyLabel="No timeline events match this search. Try clearing the search or switching back to cards."
          />
        </section>
      )}
    </div>
  );
}
