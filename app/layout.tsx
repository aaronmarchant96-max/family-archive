import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Living Red Book",
  description: "A private living archive of the maternal and paternal lines that shaped our family."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="archive-shell">
          <header className="archive-header">
            <div className="flex flex-col gap-3">
              <div className="archive-brand">
                <div className="archive-eyebrow">Private Research Archive</div>
                <div className="archive-brand__title archive-display">The Living Red Book</div>
                <div className="archive-brand__subtitle">
                  A private living archive of the maternal and paternal lines that shaped our family.
                </div>
              </div>
              <nav className="archive-nav" aria-label="Archive navigation">
                <Link className="archive-nav__link" href="/">
                  Home
                </Link>
                <Link className="archive-nav__link" href="/ancestors">
                  Ancestors
                </Link>
                <Link className="archive-nav__link" href="/documents">
                  Documents
                </Link>
              </nav>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
              Private Research Archive
            </div>
          </header>
          <main className="archive-main">{children}</main>
          <footer className="archive-footer">Private archive workspace. No public branding or sharing enabled.</footer>
        </div>
      </body>
    </html>
  );
}
