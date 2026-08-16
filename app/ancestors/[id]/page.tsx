import Link from "next/link";
import peopleData from "../../../data/people.json";
import documentsData from "../../../data/documents.json";
import type { AncestorCardProps } from "../../../components/AncestorCard";
import { Timeline } from "../../../components/Timeline";
import { RecordFrame } from "../../../components/RecordFrame";
import { SourcePreview } from "../../../components/SourcePreview";

const people = peopleData as AncestorCardProps[];
const documents = documentsData as Array<{ id: string; filename: string; previewUrl?: string; sourceCitation?: string }>;
export const dynamic = "force-dynamic";

export default function AncestorPreviewPage({ params }: { params: { id: string } }) {
  const person = people.find((entry) => entry.id === params.id);
  const isCharlesDyer = person?.id === "charles-dyer";
  const attachedRecord = person?.attachedDocument
    ? documents.find((document) => document.filename.toLowerCase() === person.attachedDocument?.toLowerCase())
    : undefined;

  if (!person) {
    return (
      <section className="archive-panel space-y-4">
        <div className="archive-kicker">Ancestor record</div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">Record not found</h1>
        <p className="text-sm leading-6 text-[var(--archive-text-soft)]">This placeholder route will be replaced when full profiles are ready.</p>
        <Link className="archive-nav__link inline-flex" href="/ancestors">
          Back to ancestor cards
        </Link>
      </section>
    );
  }

  return (
    <section className="archive-panel space-y-8">
      <div className="archive-kicker">Ancestor record preview</div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">{person.name}</h1>
        <div className="mt-1 text-sm text-[var(--archive-text-soft)]">{person.branch} · {person.lifespan}</div>
      </div>
      <p className="max-w-2xl text-sm leading-7 text-[var(--archive-text-soft)]">
        This page shows the known facts and evidence for {person.name}. The timeline below highlights key life events backed by documents where available.
      </p>
      {(person.sourceUrl || person.sourceCitation) ? (
        <section className="archive-panel space-y-3">
          <div className="archive-section__title">Source citation</div>
          {person.sourceUrl ? (
            <a
              href={person.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-sm leading-6 underline decoration-[rgba(127,29,45,0.35)] underline-offset-4 hover:text-[var(--archive-accent)]"
            >
              {person.sourceCitation ?? person.sourceUrl}
            </a>
          ) : (
            <p className="text-sm leading-6 text-[var(--archive-text)]">{person.sourceCitation}</p>
          )}
        </section>
      ) : null}
      {person.portraitUrl ? (
        <section className="archive-panel space-y-4">
          <div className="archive-section__title">Portrait</div>
          <div className="overflow-hidden rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)]">
            <SourcePreview src={person.portraitUrl} title={person.portraitCaption ?? person.name} className="h-[28rem] w-full" />
          </div>
          {person.portraitCaption ? <div className="text-xs leading-5 text-[var(--archive-text-soft)]">{person.portraitCaption}</div> : null}
        </section>
      ) : null}
      {attachedRecord?.previewUrl ? (
        <section className="archive-panel space-y-4">
          <div className="archive-section__title">Primary source image</div>
          <div className="overflow-hidden rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)]">
            <SourcePreview
              src={attachedRecord.previewUrl}
              title={attachedRecord.filename}
              className="h-[24rem] w-full"
            />
          </div>
          <div className="text-xs leading-5 text-[var(--archive-text-soft)]">
            Source file: {attachedRecord.filename}
          </div>
        </section>
      ) : null}
      <RecordFrame
        evidence={[
          person.attachedDocument ? `Attached record: ${person.attachedDocument}` : "Attached record: not listed",
          person.sourceCitation ? `Source: ${person.sourceCitation}` : person.sourceUrl ? `Source: ${person.sourceUrl}` : "Source: not listed",
          person.timeline?.length ? `${person.timeline.length} linked timeline event(s)` : "No timeline entered yet",
          person.evidenceSummary?.length ? person.evidenceSummary.slice(0, 2).join(" · ") : "Supporting evidence is being organized"
        ].join(" · ")}
        claim={person.keyEvent}
        confidence={person.confidence}
        narrative={person.summary}
      />

      {person.timeline?.length ? (
        <section className="space-y-4 pt-4">
          <div className="archive-section__title">Life &amp; Evidence Timeline</div>
          <Timeline entries={person.timeline} />
        </section>
      ) : null}

      {person.evidenceSummary?.length ? (
        <section className="space-y-4 pt-4">
          <div className="archive-section__title">Evidence Summary</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="grid gap-x-6 gap-y-2 text-sm leading-7 text-[var(--archive-text)] sm:grid-cols-2">
              {person.evidenceSummary.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--archive-accent)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {person.sarLineStatus ? (
        <section className="space-y-6 pt-4">
          <div className="archive-section__title">
            {isCharlesDyer ? "Confirmed Direct Revolutionary War Line" : "SAR Line Status"}
          </div>
          {isCharlesDyer ? (
            <div className="rounded-2xl border border-[rgba(127,29,45,0.12)] bg-[rgba(127,29,45,0.05)] p-4 text-sm leading-6 text-[var(--archive-text)]">
              Charles Dyer&apos;s Revolutionary War service is supported by the 1778 discharge record, and the descent
              through Jonathan Dyer is documented in the family evidence and census trail.
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-5 text-sm leading-7 text-[var(--archive-text)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Patriot ancestor</div>
              <div className="mt-1">{person.sarLineStatus.patriotAncestor}</div>
            </div>
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-5 text-sm leading-7 text-[var(--archive-text)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Service</div>
              <div className="mt-1">{person.sarLineStatus.service}</div>
            </div>
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-5 text-sm leading-7 text-[var(--archive-text)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Key record</div>
              <div className="mt-1">{person.sarLineStatus.keyRecord}</div>
            </div>
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-5 text-sm leading-7 text-[var(--archive-text)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Status</div>
              <div className="mt-1">{person.sarLineStatus.status}</div>
            </div>
            {isCharlesDyer ? (
              <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-5 text-sm leading-7 text-[var(--archive-text)] md:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Descent</div>
                <div className="mt-1">Documented descent through Jonathan Dyer</div>
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-[rgba(18,20,24,0.03)] p-5 text-sm leading-7 text-[var(--archive-text)]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--archive-accent)]">Note</div>
            <div className="mt-1">{person.sarLineStatus.note}</div>
          </div>
        </section>
      ) : null}

      <Link className="archive-nav__link inline-flex" href="/ancestors">
        Back to ancestor cards
      </Link>
    </section>
  );
}
