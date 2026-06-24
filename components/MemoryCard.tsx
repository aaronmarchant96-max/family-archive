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
    <article className="archive-panel flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Family memory</div>
          <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
        </div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="text-sm text-slate-300">Shared by: {sharedBy}</div>
      <div className="text-sm text-slate-300">Approximate era: {era}</div>
      <div className="text-sm text-slate-300">Mode: {mode}</div>
      {relatedPeople.length ? <div className="text-sm text-slate-400">Related people: {relatedPeople.join(", ")}</div> : null}
      {relatedPlaces.length ? <div className="text-sm text-slate-400">Related places: {relatedPlaces.join(", ")}</div> : null}
      <p className="text-sm leading-6 text-slate-300">{notes}</p>
    </article>
  );
}
