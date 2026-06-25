"use client";

import { useState } from "react";

interface TranscriptSection {
  heading: string;
  text: string;
}

export function TranscriptViewer({ sections }: { sections: TranscriptSection[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${safeTerm})`, "gi");
    return text.replace(regex, '<mark class="bg-yellow-200 text-black px-0.5 rounded">$1</mark>');
  };

  const filtered = sections.map((section) => ({
    ...section,
    highlighted: highlightText(section.text, searchTerm),
  }));

  return (
    <section className="archive-panel space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="archive-section__title">Transcript</div>
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search transcript (e.g. Jonathan, Fort Randolph, discharge)"
            className="w-full rounded-xl border border-[rgba(18,20,24,0.08)] bg-white/70 px-3 py-1.5 text-sm placeholder:text-[var(--archive-text-soft)] focus:border-[rgba(127,29,45,0.4)]"
          />
        </div>
      </div>

      <p className="text-xs text-[var(--archive-text-soft)]">
        Search and highlighting available. Results update live below.
      </p>

      <div className="space-y-6">
        {filtered.map((section, idx) => (
          <div key={idx} className="border-l-2 border-[var(--archive-accent)]/30 pl-4">
            <h3 className="font-semibold text-lg mb-2 text-[var(--archive-text)] archive-display">{section.heading}</h3>
            <div
              className="text-sm leading-7 text-[var(--archive-text)]"
              dangerouslySetInnerHTML={{ __html: section.highlighted }}
            />
          </div>
        ))}
        {searchTerm && filtered.every((s) => !s.text.toLowerCase().includes(searchTerm.toLowerCase())) && (
          <p className="text-sm text-[var(--archive-text-soft)] italic">No matches found for “{searchTerm}”.</p>
        )}
      </div>
    </section>
  );
}
