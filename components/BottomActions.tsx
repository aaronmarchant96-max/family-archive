'use client';

import { useState } from 'react';

export function BottomActions() {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const main = document.querySelector('.archive-main');
    if (!main) return;

    // Get clean text content, excluding some nav if needed but keep simple
    const text = (main.textContent || '').trim();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mt-6 flex justify-center gap-2 text-[11px] text-[var(--archive-text-soft)]">
      <button
        onClick={handleCopyAll}
        className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/60 px-3 py-1 hover:bg-white transition"
        aria-label="Copy all page content to clipboard"
      >
        {copied ? 'Copied!' : 'Copy all'}
      </button>
      <button
        onClick={scrollToTop}
        className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/60 px-3 py-1 hover:bg-white transition"
        aria-label="Scroll back to top of page"
      >
        Back to top ↑
      </button>
    </div>
  );
}
