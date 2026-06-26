"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type { AncestorCardProps } from "./AncestorCard";
import {
  canonicalEvents,
  eventConfidenceLabel,
  eventDisplayKind,
  eventDuplicateLabel,
  eventsForPeople,
  fullEvents,
  queueEvents,
} from "../lib/mrcm";

export function AncestorsTimeline({
  people,
  queueOnly,
  onClearQueue,
}: {
  people: AncestorCardProps[];
  queueOnly: boolean;
  onClearQueue: () => void;
}) {
  const [canonicalOnly, setCanonicalOnly] = useState(true);
  const [includeRelationalEchoes, setIncludeRelationalEchoes] = useState(false);
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [conflictOnly, setConflictOnly] = useState(false);

  const peopleIds = useMemo(() => new Set(people.map((person) => person.id)), [people]);

  const visibleEvents = useMemo(
    () =>
      eventsForPeople(peopleIds, fullEvents, {
        canonicalOnly,
        includeRelationalEchoes,
        needsReviewOnly,
        conflictOnly,
        queueOnly,
      }),
    [canonicalOnly, conflictOnly, includeRelationalEchoes, needsReviewOnly, peopleIds, queueOnly]
  );

  const queueCount = useMemo(
    () => new Set(queueEvents(fullEvents).filter((event) => peopleIds.has(event.person_id)).map((event) => event.person_id)).size,
    [peopleIds]
  );

  const canonicalCount = useMemo(
    () => eventsForPeople(peopleIds, canonicalEvents, {
      canonicalOnly: true,
      includeRelationalEchoes: includeRelationalEchoes,
      needsReviewOnly,
      conflictOnly,
      queueOnly,
    }).length,
    [conflictOnly, includeRelationalEchoes, needsReviewOnly, peopleIds, queueOnly]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/55 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={canonicalOnly}
            onClick={() => setCanonicalOnly((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
              canonicalOnly
                ? "border-[rgba(127,29,45,0.35)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)]"
            }`}
          >
            Canonical events only
          </button>
          <button
            type="button"
            aria-pressed={includeRelationalEchoes}
            onClick={() => setIncludeRelationalEchoes((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
              includeRelationalEchoes
                ? "border-[rgba(127,29,45,0.35)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)]"
            }`}
          >
            Include relational echoes
          </button>
          <button
            type="button"
            aria-pressed={needsReviewOnly}
            onClick={() => setNeedsReviewOnly((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
              needsReviewOnly
                ? "border-[rgba(127,29,45,0.35)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)]"
            }`}
          >
            Needs Review only
          </button>
          <button
            type="button"
            aria-pressed={conflictOnly}
            onClick={() => setConflictOnly((value) => !value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] ${
              conflictOnly
                ? "border-[rgba(127,29,45,0.35)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)]"
            }`}
          >
            Show conflict-tagged only
          </button>
        </div>
        {queueOnly ? (
          <button
            type="button"
            onClick={onClearQueue}
            className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-text)]"
          >
            Exit research queue
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--archive-text-soft)]">
        <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1">🟢 Primary</span>
        <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1">🔵 Strong</span>
        <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1">🟠 Needs Review</span>
        <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1">🟡 Family Memory</span>
        <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1">🟣 Compilation</span>
      </div>

      <div className="text-xs leading-5 text-[var(--archive-text-soft)]">
        Showing {visibleEvents.length} event{visibleEvents.length === 1 ? "" : "s"} across {people.length} profile
        {people.length === 1 ? "" : "s"}. Canonical set: {canonicalCount}. Research queue matches: {queueCount}.
      </div>

      {visibleEvents.length ? (
        <div className="relative pl-4 sm:pl-6">
          <div className="absolute left-1 sm:left-2 top-1 h-full w-px bg-[rgba(18,20,24,0.12)]" aria-hidden="true" />
          <div className="flex flex-col gap-4">
            {visibleEvents.map((event) => {
              const duplicateLabel = eventDuplicateLabel(event);
              const sourceLabel = eventDisplayKind(event);
              const placeLabel = event.place || event.normalized_place;
              return (
                <div key={event.event_id} className="relative">
                  <div className="absolute -left-4 sm:-left-6 top-2 h-3 w-3 rounded-full border border-[rgba(127,29,45,0.55)] bg-[rgba(127,29,45,0.8)]" aria-hidden="true" />
                  <article className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 sm:p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--archive-text)]">{event.title}</div>
                        <div className="mt-1 text-sm text-[var(--archive-text-soft)]">{event.date}</div>
                      </div>
                      <ConfidenceBadge label={eventConfidenceLabel(event)} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--archive-text-soft)]">
                        {sourceLabel}
                      </span>
                      {event.conflict_tags?.length ? (
                        <span className="rounded-full border border-[rgba(127,29,45,0.18)] bg-[rgba(127,29,45,0.08)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)]">
                          {event.conflict_tags.join(" · ")}
                        </span>
                      ) : null}
                      {event.duplicate_of ? (
                        <span className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--archive-text-soft)]">
                          Also shown on related profiles
                        </span>
                      ) : null}
                    </div>
                    {duplicateLabel ? (
                      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--archive-text-soft)]">
                        {duplicateLabel}
                      </div>
                    ) : null}
                    <p className="mt-3 text-sm leading-6 text-[var(--archive-text)]">{event.summary}</p>
                    {event.notes ? (
                      <details className="mt-3 rounded-xl border border-[rgba(18,20,24,0.08)] bg-white/65 p-3">
                        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)]">
                          Expand evidence notes
                        </summary>
                        <p className="mt-2 text-sm leading-6 text-[var(--archive-text)]">{event.notes}</p>
                      </details>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--archive-text-soft)]">
                      {placeLabel ? <span>Place: {placeLabel}</span> : null}
                      {event.related_person_ids.length ? (
                        <span>
                          Also shown on:{" "}
                          {event.related_person_ids
                            .slice(0, 3)
                            .map((personId) => personId.replace(/-/g, " "))
                            .join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <Link
                      href={`/ancestors/${event.person_id}`}
                      className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.22em] text-[var(--archive-accent)] hover:text-[var(--archive-accent-soft)]"
                    >
                      Open record
                    </Link>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="archive-empty">
          No timeline events match these filters. Try clearing the queue or relaxing the canonical / review toggles.
        </div>
      )}
    </div>
  );
}
