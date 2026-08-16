import Link from "next/link";
import { notFound } from "next/navigation";
import documentsData from "../../../data/documents.json";
import peopleData from "../../../data/people.json";
import { ConfidenceBadge } from "../../../components/ConfidenceBadge";
import { RecordFrame } from "../../../components/RecordFrame";
import type { DocumentCardProps } from "../../../components/DocumentCard";
import type { AncestorCardProps } from "../../../components/AncestorCard";
import { SourcePreview } from "../../../components/SourcePreview";
import { TranscriptViewer } from "../../../components/TranscriptViewer";

const documents = documentsData as DocumentCardProps[];
const people = peopleData as AncestorCardProps[];
export const dynamic = "force-dynamic";

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
  const docTitle = (document as DocumentCardProps & { title?: string }).title || document.type;
  const dateRange = (document as DocumentCardProps & { dateRange?: string }).dateRange || document.date || "Not listed";

  // Charles Dyer structured transcript sections (server data)
  const charlesDyerTranscript = isCharlesDyer
    ? [
        {
          heading: "Discharge",
          text: "I do hereby certify that Charles Dyer a soldier in Captain William McKee's company of the 12th Virginia Regiment has served upwards of two years in the said Regiment and that his time of enlistment having fully expired he is hereby discharged from the service of the United States. Given under my hand at Fort Randolph this 25th day of September 1778."
        },
        {
          heading: "Pay Settlement",
          text: "The bearer Charles Dyer has received full pay and settlement for his services in the Continental Army up to the date of discharge. Time served confirmed as upwards of two years."
        },
        {
          heading: "Affidavit (1855 County Court)",
          text: "In the year 1855 an affidavit was made in the county court identifying this discharge certificate as the property of Charles Dyer. The document names Jonathan Dyer among the heirs of the said Charles Dyer and confirms that the certificate is the original Revolutionary War discharge for the pension applicant. This supports Charles Dyer's confirmed military service and the Marchant Dyer SAR proof chain."
        }
      ]
    : [];

  // Navigation
  const currentIndex = documents.findIndex((d) => d.id === params.id);
  const prevDoc = currentIndex > 0 ? documents[currentIndex - 1] : null;
  const nextDoc = currentIndex < documents.length - 1 ? documents[currentIndex + 1] : null;

  return (
    <section className="flex flex-col gap-6">
      {/* Breadcrumb and Navigation */}
      <div className="flex flex-col gap-2">
        <nav className="text-sm text-[var(--archive-text-soft)]">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/documents" className="hover:underline">Documents</Link>
          <span className="mx-1">/</span>
          <span>{docTitle}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {prevDoc && (
              <Link
                href={`/documents/${prevDoc.id}`}
                className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/60 px-3 py-1 text-xs hover:bg-white"
              >
                ← Previous
              </Link>
            )}
            {nextDoc && (
              <Link
                href={`/documents/${nextDoc.id}`}
                className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/60 px-3 py-1 text-xs hover:bg-white"
              >
                Next →
              </Link>
            )}
          </div>
          <Link href="/documents" className="archive-nav__link inline-flex text-xs">
            Back to Documents index
          </Link>
        </div>
      </div>

      {/* Metadata Header */}
      <div className="archive-panel space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="archive-kicker">Document record</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
              {docTitle}
            </h1>
          </div>
          <ConfidenceBadge label={document.confidence} />
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Type</div>
            <div className="mt-1 font-medium">{document.type}</div>
          </div>
          { (document as any).branch && (
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Branch</div>
              <div className="mt-1 font-medium">{(document as any).branch}</div>
            </div>
          )}
          <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Date Range</div>
            <div className="mt-1 font-medium">{dateRange}</div>
          </div>
          <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Place</div>
            <div className="mt-1">{document.place || "Not listed"}</div>
          </div>
          <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Confidence</div>
            <div className="mt-1"><ConfidenceBadge label={document.confidence} /></div>
          </div>
        </div>

        {(sourceUrl || sourceCitation) && (
          <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-3 text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Source Citation</div>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex underline decoration-[rgba(127,29,45,0.35)] underline-offset-4 hover:text-[var(--archive-accent)]"
              >
                {sourceCitation ?? sourceUrl}
              </a>
            ) : (
              <div className="mt-1">{sourceCitation}</div>
            )}
          </div>
        )}

        <div className="text-xs text-[var(--archive-text-soft)]">
          Title: {docTitle} • Filename: {document.filename}
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
        claim={ (document as any).fact && (document as any).meaning ? `${(document as any).fact} ${(document as any).meaning}` : (document.whatItProves || "Details in record.") }
        confidence={document.confidence}
        narrative={notes}
      />

      {document.previewUrl ? (
        <section className="archive-panel space-y-4">
          <div className="archive-section__title">Primary source scan</div>
          <div className="overflow-hidden rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)]">
            <SourcePreview src={document.previewUrl} title={document.filename} className="h-[34rem] w-full" />
          </div>
        </section>
      ) : null}

      {/* Structured Transcript for Charles Dyer with search */}
      {isCharlesDyer && charlesDyerTranscript.length > 0 && (
        <TranscriptViewer sections={charlesDyerTranscript} />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="flex flex-col gap-6">
          <section className="archive-panel">
            <div className="archive-section__title">Linked people</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {linkedPeople.map((person) => (
                <Link
                  key={`${document.id}-${person.name}`}
                  href={person.href}
                  className="rounded-full border border-[rgba(18,20,24,0.08)] bg-white/60 px-4 py-2 text-sm text-[var(--archive-text)] hover:border-[rgba(127,29,45,0.35)] hover:bg-white"
                >
                  {person.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="archive-panel space-y-3">
            <div className="archive-section__title">Notes</div>
            <p className="text-sm leading-6 text-[var(--archive-text)]">{notes}</p>
          </section>
        </div>

        <aside className="archive-panel space-y-4">
          <div className="archive-section__title">A note for family members</div>
          <p className="text-sm leading-6 text-[var(--archive-text)]">
            We keep the original scan with the record so you can look at the actual document and the notes together.
            Everything stays private within the family.
          </p>
          <div className="rounded-2xl border border-dashed border-[rgba(18,20,24,0.12)] bg-white/40 p-4 text-sm leading-6 text-[var(--archive-text-soft)]">
            This page shows the real document (or a photo of it). It’s not a public website.
          </div>
        </aside>
      </div>
    </section>
  );
}
