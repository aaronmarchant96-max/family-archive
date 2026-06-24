import Link from "next/link";
import peopleData from "../data/people.json";
import documentsData from "../data/documents.json";
import familyMemoryData from "../data/familyMemory.json";
import { AncestorCard, type AncestorCardProps } from "../components/AncestorCard";
import { DocumentCard, type DocumentCardProps } from "../components/DocumentCard";
import { MemoryCard, type FamilyMemoryEntry } from "../components/MemoryCard";

const people = peopleData as AncestorCardProps[];
const documents = documentsData as DocumentCardProps[];
const familyMemory = familyMemoryData as FamilyMemoryEntry[];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="archive-hero">
        <div className="archive-hero__copy">
          <div className="archive-kicker">Landing page</div>
          <h1>Marchant Family Archive</h1>
          <p>
            A private living archive built from family records, Anne&apos;s book, and ongoing research.
          </p>
          <div className="archive-badge-row">
            <span className="archive-badge">Private</span>
            <span className="archive-badge">Next.js 14</span>
            <span className="archive-badge">TypeScript</span>
            <span className="archive-badge">Tailwind CSS</span>
          </div>
        </div>
        <div className="archive-panel">
          <div className="text-sm font-semibold text-white">Quick navigation</div>
          <div className="mt-3 grid gap-2">
            <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10" href="/ancestors">
              View ancestor cards
            </Link>
            <Link className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10" href="/documents">
              View document previews
            </Link>
          </div>
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Family Memory / Oral History</div>
            <div className="archive-section__copy">
              Story material, family recollection, and notebook content that may guide research but is not the same
              thing as a sourced record.
            </div>
          </div>
        </div>
        <div className="archive-grid">
          {familyMemory.length ? (
            familyMemory.map((entry) => <MemoryCard key={entry.id} {...entry} />)
          ) : (
            <div className="archive-empty">
              No family memory entries yet. Add recollections, approximate eras, and context notes separately from
              sourced records.
            </div>
          )}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Ancestors</div>
            <div className="archive-section__copy">Confirmed people and evidence notes pulled from `data/people.json`.</div>
          </div>
          <Link className="archive-nav__link" href="/ancestors">
            Open page
          </Link>
        </div>
        <div className="archive-grid">
          {people.length ? (
            people.map((person) => <AncestorCard key={person.id} {...person} />)
          ) : (
            <div className="archive-empty">
              No ancestor records loaded yet. Add a confirmed person, a key event, and an attached record to
              `data/people.json`.
            </div>
          )}
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-section__head">
          <div>
            <div className="archive-section__title">Documents</div>
            <div className="archive-section__copy">Metadata-only document records pulled from `data/documents.json`.</div>
          </div>
          <Link className="archive-nav__link" href="/documents">
            Open page
          </Link>
        </div>
        <div className="archive-grid">
          {documents.length ? (
            documents.map((document) => <DocumentCard key={document.id} {...document} />)
          ) : (
            <div className="archive-empty">
              No document records loaded yet. Add filenames, people, places, and proof notes to
              `data/documents.json`.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
