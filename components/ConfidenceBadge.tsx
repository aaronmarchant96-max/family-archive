const badgeStyles: Record<string, string> = {
  Confirmed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "Primary Source": "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  "Strong Evidence": "border-sky-400/30 bg-sky-400/10 text-sky-200",
  "Family-Confirmed Oral History": "border-violet-400/30 bg-violet-400/10 text-violet-100",
  "Needs Review": "border-rose-400/30 bg-rose-400/10 text-rose-100",
  "Needs Proof": "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

const badgeAliases: Record<string, string> = {
  Verified: "Confirmed",
};

const friendlyLabels: Record<string, string> = {
  "Primary Source": "🟢 Primary Source",
  "Strong Evidence": "🔵 Strong Evidence",
  "Confirmed": "🟢 Primary Source",
  "Family-Confirmed Oral History": "🟡 Family Memory",
  "Needs Review": "🟠 Needs Review",
  "Needs Proof": "🟠 Needs Review",
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
