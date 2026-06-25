import { ConfidenceBadge } from "./ConfidenceBadge";

export interface FamilyMemoryEntry {
  id: string;
  title: string;
  sharedBy: string;
  era: string;
  mode: string;
  relatedPeople: string[];
  relatedPlaces: string[];
  confidence: string;
  notes: string;
}

export function MemoryCard({ title, sharedBy, era, mode, relatedPeople, relatedPlaces, confidence, notes }: FamilyMemoryEntry) {
  return (
    <article className="archive-panel flex flex-col gap-4 border-l-4 border-l-[rgba(127,29,45,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Family memory</div>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">{title}</h3>
        </div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="text-sm text-[var(--archive-text-soft)]">Shared by: {sharedBy}</div>
      <div className="text-sm text-[var(--archive-text-soft)]">Approximate era: {era}</div>
      <div className="text-sm text-[var(--archive-text-soft)]">Mode: {mode}</div>
      {relatedPeople.length ? <div className="text-sm text-[var(--archive-text-soft)]">Related people: {relatedPeople.join(", ")}</div> : null}
      {relatedPlaces.length ? <div className="text-sm text-[var(--archive-text-soft)]">Related places: {relatedPlaces.join(", ")}</div> : null}
      <p className="text-sm leading-6 text-[var(--archive-text)]">{notes}</p>
    </article>
  );
}
