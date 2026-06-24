import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Archive",
  description: "A private digital archive of family history."
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
            <div className="archive-brand">
              <div className="archive-kicker">Private archive</div>
              <div className="archive-brand__title">Family Archive</div>
              <div className="archive-brand__subtitle">
                A private digital archive of our family history.
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
          </header>
          <main className="archive-main">{children}</main>
          <footer className="archive-footer">Private archive workspace. No public branding or sharing enabled.</footer>
        </div>
      </body>
    </html>
  );
}
