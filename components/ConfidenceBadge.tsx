const badgeStyles: Record<string, string> = {
  Confirmed: "border-emerald-300 bg-emerald-100 text-emerald-800",
  "Primary Source": "border-emerald-300 bg-emerald-100 text-emerald-800",
  "Corroborated Compilation": "border-violet-300 bg-violet-100 text-violet-800",
  "Strong Evidence": "border-sky-300 bg-sky-100 text-sky-800",
  "Family-Confirmed Oral History": "border-amber-300 bg-amber-100 text-amber-800",
  "Needs Review": "border-orange-300 bg-orange-100 text-orange-800",
  "Needs Proof": "border-orange-300 bg-orange-100 text-orange-800",
};

const badgeAliases: Record<string, string> = {
  Verified: "Confirmed",
};

const friendlyLabels: Record<string, string> = {
  "Primary Source": "🟢 Primary Source",
  "Strong Evidence": "🔵 Strong Evidence",
  "Corroborated Compilation": "🟣 Corroborated Compilation",
  "Confirmed": "🟢 Primary Source",
  "Family-Confirmed Oral History": "🟡 Family Memory",
  "Needs Review": "🟠 Needs Review",
  "Needs Proof": "🟠 Needs Review",
};

export function ConfidenceBadge({ label }: { label: string }) {
  const normalizedLabel = badgeAliases[label] ?? label;
  const displayLabel = friendlyLabels[normalizedLabel] ?? normalizedLabel;
  const className = badgeStyles[normalizedLabel] ?? "border-neutral-300 bg-neutral-100 text-neutral-700";

  const emoji = displayLabel.match(/^[^\s]+/)?.[0] ?? "";
  const text = displayLabel.replace(/^[^\s]+\s*/, "");

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] ${className}`}>
      <span className="text-[13px] leading-none -mt-px bg-white/50 rounded px-0.5 ring-1 ring-white/60">{emoji}</span>
      <span>{text}</span>
    </span>
  );
}
