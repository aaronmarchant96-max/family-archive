const badgeStyles: Record<string, string> = {
  Confirmed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "Primary Source": "border-sky-400/30 bg-sky-400/10 text-sky-200",
  "Strong Evidence": "border-amber-400/30 bg-amber-400/10 text-amber-100",
  "Family-Confirmed Oral History": "border-violet-400/30 bg-violet-400/10 text-violet-100",
  "Needs Review": "border-rose-400/30 bg-rose-400/10 text-rose-100",
  "Needs Proof": "border-slate-400/30 bg-slate-400/10 text-slate-100",
};

const badgeAliases: Record<string, string> = {
  Verified: "Confirmed",
};

const friendlyLabels: Record<string, string> = {
  "Primary Source": "Strong original document",
  "Strong Evidence": "Very reliable",
  "Confirmed": "Well confirmed",
  "Family-Confirmed Oral History": "Trusted family story",
  "Needs Review": "Needs more checking",
  "Needs Proof": "Still looking for proof",
};

export function ConfidenceBadge({ label }: { label: string }) {
  const normalizedLabel = badgeAliases[label] ?? label;
  const displayLabel = friendlyLabels[normalizedLabel] ?? normalizedLabel;
  const className = badgeStyles[normalizedLabel] ?? "border-white/10 bg-white/5 text-slate-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${className}`}>
      {displayLabel}
    </span>
  );
}
