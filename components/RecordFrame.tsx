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
      <div className="archive-section__title">Evidence, claim, confidence, narrative</div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Evidence</div>
          <div className="mt-1 leading-6 text-slate-100">{evidence}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Claim</div>
          <div className="mt-1 leading-6 text-slate-100">{claim}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Confidence</div>
          <div className="mt-2">
            <ConfidenceBadge label={confidence} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Narrative</div>
          <div className="mt-1 leading-6 text-slate-100">{narrative}</div>
        </div>
      </div>
    </section>
  );
}
