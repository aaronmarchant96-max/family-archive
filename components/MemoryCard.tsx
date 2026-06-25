import { ConfidenceBadge } from "./ConfidenceBadge";

export interface FamilyMemoryEntry {
  id: string;
  title: string;
  categoryLabel?: string;
  materialType?: string;
  sharedBy: string;
  era: string;
  mode: string;
  evidenceMode?: string;
  compiledBy?: string;
  chronology?: string;
  relatedPeople: string[];
  relatedPlaces: string[];
  relatedLines?: string[];
  confidence: string;
  description?: string;
  notes: string;
}

export function MemoryCard({
  title,
  categoryLabel,
  materialType,
  sharedBy,
  era,
  mode,
  evidenceMode,
  compiledBy,
  chronology,
  relatedPeople,
  relatedPlaces,
  relatedLines,
  confidence,
  description,
  notes
}: FamilyMemoryEntry) {
  const headingLabel = categoryLabel ?? (confidence === "Family-Confirmed Oral History" ? "Family oral history" : "Family memory");
  return (
    <article className="archive-panel flex flex-col gap-4 border-l-4 border-l-[rgba(127,29,45,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">{headingLabel}</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">{title}</h3>
        </div>
        <ConfidenceBadge label={confidence} />
      </div>
      {materialType ? <div className="text-sm text-[var(--archive-text-soft)]">Material type: {materialType}</div> : null}
      {compiledBy ? <div className="text-sm text-[var(--archive-text-soft)]">Compiled by: {compiledBy}</div> : null}
      <div className="text-sm text-[var(--archive-text-soft)]">Shared by: {sharedBy}</div>
      <div className="text-sm text-[var(--archive-text-soft)]">Approximate era: {era}</div>
      <div className="text-sm text-[var(--archive-text-soft)]">{evidenceMode ? "Evidence mode" : "Mode"}: {evidenceMode ?? mode}</div>
      {chronology ? <div className="text-sm text-[var(--archive-text-soft)]">Chronology: {chronology}</div> : null}
      {relatedPeople.length ? <div className="text-sm text-[var(--archive-text-soft)]">Related people: {relatedPeople.join(", ")}</div> : null}
      {relatedPlaces.length ? <div className="text-sm text-[var(--archive-text-soft)]">Related places: {relatedPlaces.join(", ")}</div> : null}
      {relatedLines?.length ? <div className="text-sm text-[var(--archive-text-soft)]">Related lines: {relatedLines.join(", ")}</div> : null}
      {description ? <p className="text-sm leading-6 text-[var(--archive-text)]">{description}</p> : null}
      <p className="text-sm leading-6 text-[var(--archive-text)]">{notes}</p>
    </article>
  );
}
