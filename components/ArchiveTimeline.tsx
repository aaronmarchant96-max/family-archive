"use client";

import { ConfidenceBadge } from "./ConfidenceBadge";

export type ArchiveTimelineEvent = {
  id: string;
  title: string;
  dateLabel: string;
  year: number | null;
  place?: string;
  confidence: string;
  summary: string;
  supports: string;
  linkedPeople?: Array<{ name: string; href?: string }>;
  linkedDocuments?: Array<{ label: string; href?: string }>;
  category: "record" | "person" | "memory" | "research" | "milestone";
  certainty?: "solid" | "strong" | "dotted" | "oral";
};

export type ArchiveEraJump = {
  label: string;
  startYear: number;
  endYear: number;
};

function confidenceStyle(confidence: string) {
  if (confidence === "Primary Source" || confidence === "Confirmed") {
    return "solid";
  }
  if (confidence === "Strong Evidence") {
    return "strong";
  }
  if (confidence === "Family-Confirmed Oral History") {
    return "oral";
  }
  return "dotted";
}

export function parseArchiveYear(value: string | number | null | undefined) {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = value.toLowerCase().trim();

  if (!normalized || normalized === "needs verification" || normalized === "date not listed" || normalized === "later generations") {
    return null;
  }

  const rangeMatch = normalized.match(/(\d{3,4})\s*[-–]\s*(\d{2,4})/);
  if (rangeMatch) {
    return Number.parseInt(rangeMatch[1], 10);
  }

  const decadeMatch = normalized.match(/(\d{3})0s/);
  if (decadeMatch) {
    return Number.parseInt(`${decadeMatch[1]}0`, 10);
  }

  const yearMatch = normalized.match(/(\d{4})/);
  return yearMatch ? Number.parseInt(yearMatch[1], 10) : null;
}

export function ArchiveTimeline({
  events,
  minYear,
  maxYear,
  startYear,
  endYear,
  onRangeChange,
  selectedEventId,
  onSelectEvent,
  eraJumps
}: {
  events: ArchiveTimelineEvent[];
  minYear: number;
  maxYear: number;
  startYear: number;
  endYear: number;
  onRangeChange: (nextStart: number, nextEnd: number) => void;
  selectedEventId: string | null;
  onSelectEvent: (event: ArchiveTimelineEvent) => void;
  eraJumps: ArchiveEraJump[];
}) {
  const visibleCount = events.filter((event) => event.year != null && event.year >= startYear && event.year <= endYear).length;

  return (
    <section className="archive-panel space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="archive-kicker">Interactive family timeline</div>
          <h2 className="archive-section__title text-3xl">Timeline View</h2>
          <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
            Drag the range to narrow the archive. Solid markers are documentary anchors; confirmed Red Book
            compilation entries stay distinct from original letters, and dotted markers are bridge material or oral
            history that should remain visually separate from primary evidence.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(18,20,24,0.1)] bg-[rgba(18,20,24,0.03)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--archive-text-soft)]">
          {visibleCount} dated item{visibleCount === 1 ? "" : "s"} in range
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {eraJumps.map((jump) => (
            <button
              key={jump.label}
              type="button"
              onClick={() => onRangeChange(jump.startYear, jump.endYear)}
              className="rounded-full border border-[rgba(18,20,24,0.1)] bg-white/55 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--archive-text)] transition hover:border-[rgba(139,31,43,0.35)] hover:bg-white"
            >
              {jump.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-[1.5rem] border border-[rgba(18,20,24,0.1)] bg-[rgba(12,14,18,0.72)] p-4 text-[var(--archive-ink)]">
            <div className="flex items-center justify-between gap-3 pb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(244,239,231,0.72)]">
              <span>{startYear}</span>
              <span className="text-[var(--archive-accent-soft)]">Selected year range</span>
              <span>{endYear}</span>
            </div>
            <div className="relative h-16">
              <input
                aria-label="Timeline start year"
                type="range"
                min={minYear}
                max={maxYear}
                value={startYear}
                onChange={(event) => {
                  const nextStart = Math.min(Number(event.target.value), endYear - 1);
                  onRangeChange(nextStart, endYear);
                }}
                className="archive-range absolute inset-x-0 top-3 z-20 h-3 w-full appearance-none bg-transparent"
              />
              <input
                aria-label="Timeline end year"
                type="range"
                min={minYear}
                max={maxYear}
                value={endYear}
                onChange={(event) => {
                  const nextEnd = Math.max(Number(event.target.value), startYear + 1);
                  onRangeChange(startYear, nextEnd);
                }}
                className="archive-range archive-range--secondary absolute inset-x-0 top-3 z-10 h-3 w-full appearance-none bg-transparent"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(244,239,231,0.56)]">
              <span>{minYear}</span>
              <span>{maxYear}</span>
            </div>

            <div className="mt-5 overflow-x-auto pb-2">
              <div className="relative min-w-[1200px] select-none pt-3">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[rgba(244,239,231,0.18)]" aria-hidden="true" />
                {events.map((event, index) => {
                  if (event.year == null || event.year < startYear || event.year > endYear) {
                    return null;
                  }

                  const percent = maxYear === minYear ? 0 : ((event.year - minYear) / (maxYear - minYear)) * 100;
                  const selected = event.id === selectedEventId;
                  const certainty = event.certainty ?? confidenceStyle(event.confidence);
                  const isTopRow = index % 2 === 0;

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className={`archive-timeline-node absolute w-[200px] -translate-x-1/2 text-left transition ${
                        selected ? "scale-[1.03]" : "hover:-translate-y-0.5"
                      }`}
                      style={{
                        left: `${percent}%`,
                        top: isTopRow ? "1rem" : "7.75rem"
                      }}
                    >
                      <div
                        className={`rounded-2xl border p-3 shadow-lg shadow-black/20 ${
                          certainty === "solid"
                            ? "border-[rgba(233,217,205,0.24)] bg-[rgba(244,239,231,0.94)] text-[var(--archive-text)]"
                            : certainty === "strong"
                              ? "border-[rgba(160,123,70,0.28)] bg-[rgba(237,229,217,0.95)] text-[var(--archive-text)]"
                              : certainty === "oral"
                                ? "border border-dashed border-[rgba(190,174,215,0.4)] bg-[rgba(37,29,46,0.9)] text-[rgba(244,239,231,0.94)]"
                                : "border border-dashed border-[rgba(139,31,43,0.38)] bg-[rgba(139,31,43,0.1)] text-[rgba(244,239,231,0.94)]"
                        } ${selected ? "ring-2 ring-[rgba(160,123,70,0.45)]" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgba(244,239,231,0.72)]">
                            {event.category}
                          </div>
                          <ConfidenceBadge label={event.confidence} />
                        </div>
                        <div className="mt-2 text-sm font-semibold leading-5 archive-display">{event.title}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-[rgba(244,239,231,0.64)]">{event.dateLabel}</div>
                        {event.place ? <div className="mt-2 text-xs leading-5 text-[rgba(244,239,231,0.72)]">{event.place}</div> : null}
                      </div>
                      <div className={`mt-2 h-3 w-3 rounded-full ${certainty === "oral" || certainty === "dotted" ? "border border-dashed border-[rgba(244,239,231,0.6)] bg-transparent" : "border border-[rgba(244,239,231,0.7)] bg-[var(--archive-accent)]"} ${selected ? "shadow-[0_0_0_6px_rgba(160,123,70,0.14)]" : ""}`} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="archive-panel space-y-4">
          <div className="archive-section__title">Record detail</div>
            <p className="text-sm leading-6 text-[var(--archive-text-soft)]">
              Click any event to open the compact evidence panel here. This keeps the timeline readable while still
              showing what the record supports.
            </p>
            <div className="rounded-[1.5rem] border border-[rgba(18,20,24,0.1)] bg-[rgba(18,20,24,0.03)] p-4">
              {selectedEventId ? (
                <SelectedEventCard event={events.find((entry) => entry.id === selectedEventId) ?? null} />
              ) : (
                <div className="text-sm leading-6 text-[var(--archive-text-soft)]">
                  Select an event to view place, confidence, linked records, and a short research note.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedEventCard({ event }: { event: ArchiveTimelineEvent | null }) {
  if (!event) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="archive-eyebrow">
            {event.category === "research" ? "Research archive" : event.category === "memory" ? "Family memory" : "Archive event"}
          </div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
            {event.title}
          </h3>
        </div>
        <ConfidenceBadge label={event.confidence} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Date" value={event.dateLabel} />
        <Info label="Place" value={event.place ?? "Not listed"} />
        <Info label="Supports" value={event.supports} wide />
        <Info label="Narrative" value={event.summary} wide />
      </div>
      {event.linkedPeople?.length ? (
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--archive-accent)]">
            Linked people
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.linkedPeople.map((person) => (
              person.href ? (
                <a
                  key={person.name}
                  href={person.href}
                  className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--archive-text)] transition hover:border-[rgba(139,31,43,0.35)] hover:bg-white"
                >
                  {person.name}
                </a>
              ) : (
                <span
                  key={person.name}
                  className="rounded-full border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--archive-text-soft)]"
                >
                  {person.name}
                </span>
              )
            ))}
          </div>
        </div>
      ) : null}
      {event.linkedDocuments?.length ? (
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--archive-accent)]">
            Linked records
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {event.linkedDocuments.map((document) => (
              <a
                key={document.label}
                href={document.href}
                className="rounded-full border border-[rgba(127,29,45,0.18)] bg-[rgba(127,29,45,0.06)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--archive-accent)] transition hover:border-[rgba(127,29,45,0.34)] hover:bg-[rgba(127,29,45,0.1)]"
              >
                {document.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 text-sm text-[var(--archive-text)] ${wide ? "sm:col-span-2" : ""}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--archive-accent)]">{label}</div>
      <div className="mt-1 leading-6">{value}</div>
    </div>
  );
}
