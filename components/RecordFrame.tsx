import { ConfidenceBadge } from "./ConfidenceBadge";

interface RecordFrameProps {
  evidence: string;
  claim: string;
  confidence: string;
  narrative: string;
}

export function RecordFrame({ evidence, claim, confidence, narrative }: RecordFrameProps) {
  return (
    <section className="archive-panel space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(18,20,24,0.08)] pb-3">
        <div>
          <div className="archive-eyebrow">Evidence frame</div>
          <div className="archive-section__title mt-1">Evidence, claim, confidence, narrative</div>
        </div>
        <ConfidenceBadge label={confidence} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 text-sm text-[var(--archive-text)] lg:row-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Evidence</div>
          <div className="mt-2 leading-6 text-[var(--archive-text)]">{evidence}</div>
        </div>
        <div className="rounded-2xl border border-[rgba(127,29,45,0.12)] bg-[rgba(127,29,45,0.05)] p-4 text-sm text-[var(--archive-text)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Claim</div>
          <div className="mt-2 leading-6">{claim}</div>
        </div>
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 text-sm text-[var(--archive-text)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Confidence</div>
          <div className="mt-2">
            <ConfidenceBadge label={confidence} />
          </div>
        </div>
        <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-4 text-sm text-[var(--archive-text)] lg:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Narrative</div>
          <div className="mt-2 leading-6 text-[var(--archive-text)]">{narrative}</div>
        </div>
      </div>
    </section>
  );
}
