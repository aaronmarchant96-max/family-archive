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
  const majorEventIds = [
    "charles-dyer-discharge",
    "jabez-hopkins-marriage",
    "thomas-anna-marriage",
    "decatur-township-1860",
    "william-isabella-marriage",
    "george-washington-dyer-1850-liberty-iowa-census",
    "george-washington-dyer-1880-whitman-census",
    "george-washington-dyer-1900-pine-city-census",
    "memory-red-book"
  ];

  const filteredEvents = events.filter((event) => event.year != null && event.year >= startYear && event.year <= endYear);
  const visibleCount = filteredEvents.length;

  const isFullRange = startYear === minYear && endYear === maxYear;
  let displayEvents = filteredEvents;
  if (isFullRange) {
    displayEvents = filteredEvents.filter((e) => majorEventIds.includes(e.id));
  }

  return (
    <section className="archive-panel space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="archive-kicker">See events through the years</div>
          <h2 className="archive-section__title text-3xl">Timeline</h2>
          <p className="max-w-3xl text-sm leading-6 text-[var(--archive-text-soft)]">
            Drag the sliders to focus on different years. Solid markers mean we have original documents for that
            event. Other markers are from family stories or research that needs more checking.
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
              className="rounded-full border border-[rgba(18,20,24,0.1)] bg-white/55 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[var(--archive-text)] transition hover:border-[rgba(139,31,43,0.35)] hover:bg-white min-h-[36px]"
            >
              {jump.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="rounded-[1.5rem] border border-[rgba(18,20,24,0.1)] bg-[rgba(12,14,18,0.72)] p-4 text-[var(--archive-ink)]">
            <div className="flex items-center justify-between gap-3 pb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[rgba(244,239,231,0.72)]">
              <span>{startYear}</span>
              <span className="text-[var(--archive-accent-soft)]">Selected year range</span>
              <span>{endYear}</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--archive-accent-soft)] mb-1">
                  <span>Start year</span>
                  <span>{startYear}</span>
                </div>
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
                  className="archive-range w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--archive-accent-soft)] mb-1">
                  <span>End year</span>
                  <span>{endYear}</span>
                </div>
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
                  className="archive-range archive-range--secondary w-full"
                />
              </div>
            </div>

            <div className="text-[10px] text-[var(--archive-accent-soft)]">
              Full range: {minYear} – {maxYear}
            </div>

            {isFullRange && filteredEvents.length > displayEvents.length && (
              <div className="mb-3 text-xs text-[var(--archive-text-soft)]">
                Zoom in to see all {filteredEvents.length} records.
              </div>
            )}

            {displayEvents.length === 0 ? (
              <div className="text-sm text-[var(--archive-text-soft)]">No events in this range.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {displayEvents
                  .sort((a, b) => (a.year ?? 0) - (b.year ?? 0))
                  .map((event) => {
                    const certainty = event.certainty ?? confidenceStyle(event.confidence);
                    const isSelected = event.id === selectedEventId;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onSelectEvent(event)}
                        className={`text-left rounded-xl border p-4 transition text-sm min-h-[118px] ${
                          isSelected ? "ring-2 ring-[rgba(160,123,70,0.45)]" : "hover:-translate-y-px"
                        } ${
                          certainty === "solid"
                            ? "border-[rgba(233,217,205,0.24)] bg-[rgba(244,239,231,0.94)] text-[var(--archive-text)]"
                            : certainty === "strong"
                              ? "border-[rgba(160,123,70,0.28)] bg-[rgba(237,229,217,0.95)] text-[var(--archive-text)]"
                            : certainty === "oral"
                              ? "border border-dashed border-[rgba(190,174,215,0.4)] bg-[rgba(37,29,46,0.9)] text-[rgba(244,239,231,0.94)]"
                              : "border border-dashed border-[rgba(139,31,43,0.38)] bg-[rgba(139,31,43,0.1)] text-[rgba(244,239,231,0.94)]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.24em] opacity-70">
                          <span>{event.dateLabel}</span>
                          <span>{event.category}</span>
                        </div>
                        <div className="mt-1 font-semibold leading-tight archive-display">{event.title}</div>
                        {event.place && <div className="mt-1 text-xs opacity-70">{event.place}</div>}
                        <div className="mt-2 flex items-center gap-2">
                          <ConfidenceBadge label={event.confidence} />
                          {isSelected && <span className="text-[10px] opacity-60">selected</span>}
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="archive-panel space-y-4">
            <div className="archive-section__title">Record detail</div>
            <p className="text-sm leading-6 text-[var(--archive-text-soft)]">
              Click any event to open the compact evidence panel here. This keeps the timeline readable while still
              showing what the record supports.
            </p>
            <div className="rounded-[1.5rem] border border-[rgba(18,20,24,0.1)] bg-[rgba(18,20,24,0.03)] p-4">
              {selectedEventId ? (
                <div>
                  <div className="text-sm font-semibold">{events.find((e) => e.id === selectedEventId)?.title}</div>
                  <div className="text-xs mt-1">{events.find((e) => e.id === selectedEventId)?.summary}</div>
                </div>
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
