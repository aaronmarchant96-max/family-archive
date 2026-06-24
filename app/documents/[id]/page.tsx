import Link from "next/link";
import { notFound } from "next/navigation";
import documentsData from "../../../data/documents.json";
import peopleData from "../../../data/people.json";
import { ConfidenceBadge } from "../../../components/ConfidenceBadge";
import { RecordFrame } from "../../../components/RecordFrame";
import type { DocumentCardProps } from "../../../components/DocumentCard";
import type { AncestorCardProps } from "../../../components/AncestorCard";
import { SourcePreview } from "../../../components/SourcePreview";

const documents = documentsData as DocumentCardProps[];
const people = peopleData as AncestorCardProps[];

export function generateStaticParams() {
  return documents.map((document) => ({ id: document.id }));
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['".,()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const document = documents.find((entry) => entry.id === params.id);

  if (!document) {
    notFound();
  }

  const linkedPeople = document.people
    .map((personName) => {
      const match = people.find((person) => person.name.toLowerCase() === personName.toLowerCase());
      return {
        name: personName,
        href: `/ancestors/${match?.id ?? slugify(personName)}`
      };
    })
    .filter(Boolean);

  const notes =
    document.notes ??
    "The source scan is shown inline on this private record page and is not exposed as a public download.";

  const isCharlesDyer = document.filename.toLowerCase() === "charles-dyer.pdf";
  const sourceUrl = (document as DocumentCardProps & { sourceUrl?: string }).sourceUrl;
  const sourceCitation = (document as DocumentCardProps & { sourceCitation?: string }).sourceCitation;

  return (
    <section className="flex flex-col gap-6">
      <div className="archive-panel space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="archive-kicker">Document record</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{document.type}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Title is shown from the archive metadata. The source file itself stays private and is not exposed here.
            </p>
          </div>
          <ConfidenceBadge label={document.confidence} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Filename</div>
          <div className="mt-1 text-base font-medium text-slate-100">{document.filename}</div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Type</div>
            <div className="mt-1 text-slate-100">{document.type}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Date</div>
            <div className="mt-1 text-slate-100">{document.date || "Not listed"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Place</div>
            <div className="mt-1 text-slate-100">{document.place || "Not listed"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Private note</div>
            <div className="mt-1 text-slate-100">
              Primary source scan is shown on this page from the archive workspace. The file stays in the private
              archive set.
            </div>
          </div>
          {(sourceUrl || sourceCitation) ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 md:col-span-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Source citation</div>
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex text-slate-100 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-100"
                >
                  {sourceCitation ?? sourceUrl}
                </a>
              ) : (
                <div className="mt-1 text-slate-100">{sourceCitation}</div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <RecordFrame
        evidence={[
          `Filename: ${document.filename}`,
          `Linked people: ${document.people.join(", ") || "Not listed"}`,
          document.place ? `Place: ${document.place}` : "Place: not listed",
          document.date ? `Date: ${document.date}` : "Date: not listed",
          sourceCitation ? `Source: ${sourceCitation}` : sourceUrl ? `Source: ${sourceUrl}` : "Source: not listed"
        ].join(" · ")}
        claim={document.whatItProves}
        confidence={document.confidence}
        narrative={notes}
      />

      {document.previewUrl ? (
        <section className="archive-panel space-y-4">
          <div className="archive-section__title">Primary source scan</div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
            <SourcePreview src={document.previewUrl} title={document.filename} className="h-[34rem] w-full" />
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="flex flex-col gap-6">
          <section className="archive-panel">
            <div className="archive-section__title">Linked people</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {linkedPeople.map((person) => (
                <Link
                  key={`${document.id}-${person.name}`}
                  href={person.href}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:border-amber-300/30 hover:bg-amber-300/10"
                >
                  {person.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="archive-panel space-y-3">
            <div className="archive-section__title">Notes</div>
            <p className="text-sm leading-6 text-slate-300">{notes}</p>
          </section>

          {isCharlesDyer ? (
            <section className="archive-panel space-y-4">
              <div className="archive-section__title">Evidence Summary</div>
              <ul className="space-y-3 text-sm leading-6 text-slate-300">
                <li>Primary Revolutionary War discharge record</li>
                <li>Charles Dyer was discharged September 25, 1778</li>
                <li>Discharged at Fort Randolph [at Point Pleasant, now WV]</li>
                <li>Bearer was Charles Dyer, soldier in Captain William McKee&apos;s company of the 12th Virginia Regiment</li>
                <li>The discharge says his enlistment time had fully expired and that he had served upwards of two years</li>
                <li>Service connected to the 12th Virginia Regiment</li>
                <li>1855 county affidavit names Jonathan Dyer among the heirs and identifies the discharge certificate as Charles Dyer&apos;s</li>
                <li>Supports Charles Dyer&apos;s confirmed military service and the Marchant Dyer SAR proof chain</li>
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="archive-panel space-y-4">
          <div className="archive-section__title">Private / local-only notice</div>
          <p className="text-sm leading-6 text-slate-300">
            The archive keeps the source file with the record so you can inspect the scan and the metadata together.
            The file is still part of the private family archive set.
          </p>
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-400">
            This is a record page with an embedded source scan, not a public download list.
          </div>
          <Link className="archive-nav__link inline-flex" href="/documents">
            Back to Documents index
          </Link>
        </aside>
      </div>
    </section>
  );
}
