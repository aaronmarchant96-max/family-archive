import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";
import { BottomActions } from "../components/BottomActions";

export const metadata: Metadata = {
  title: "The Living Red Book",
  description: "Old family documents, letters, and stories from the people who came before us."
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
                <div className="archive-eyebrow">Our Family Archive</div>
                <div className="archive-brand__title archive-display">The Living Red Book</div>
                <div className="archive-brand__subtitle text-sm sm:text-base">
                  Old records, letters, and stories from the family members who came before us.
                </div>
              </div>
              <nav className="archive-nav flex-wrap" aria-label="Archive navigation">
                <Link className="archive-nav__link text-sm px-3 py-1.5" href="/">
                  Home
                </Link>
                <Link className="archive-nav__link text-sm px-3 py-1.5" href="/ancestors">
                  Ancestors
                </Link>
                <Link className="archive-nav__link text-sm px-3 py-1.5" href="/documents">
                  Documents
                </Link>
              </nav>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-slate-200 self-start lg:self-auto">
              For family use only
            </div>
          </header>
          <main className="archive-main">{children}</main>
          <BottomActions />
          <footer className="archive-footer">Private family collection. For our use only.</footer>
        </div>
      </body>
    </html>
  );
}
