import Link from "next/link";
import peopleData from "../../../data/people.json";
import type { AncestorCardProps } from "../../../components/AncestorCard";
import { Timeline } from "../../../components/Timeline";
import { RecordFrame } from "../../../components/RecordFrame";

const people = peopleData as AncestorCardProps[];

export function generateStaticParams() {
  return people.map((person) => ({ id: person.id }));
}

export default function AncestorPreviewPage({ params }: { params: { id: string } }) {
  const person = people.find((entry) => entry.id === params.id);
  const isCharlesDyer = person?.id === "charles-dyer";

  if (!person) {
    return (
      <section className="archive-panel space-y-4">
        <div className="archive-kicker">Ancestor record</div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Record not found</h1>
        <p className="text-sm leading-6 text-slate-300">This placeholder route will be replaced when full profiles are ready.</p>
        <Link className="archive-nav__link inline-flex" href="/ancestors">
          Back to ancestor cards
        </Link>
      </section>
    );
  }

  return (
    <section className="archive-panel space-y-4">
      <div className="archive-kicker">Ancestor record preview</div>
      <h1 className="text-3xl font-semibold tracking-tight text-white">{person.name}</h1>
      <div className="text-sm text-slate-300">{person.branch}</div>
      <p className="max-w-2xl text-sm leading-6 text-slate-300">
        This is a placeholder detail page for future family notes, attached records, and timeline views.
      </p>
      <RecordFrame
        evidence={[
          person.attachedDocument ? `Attached record: ${person.attachedDocument}` : "Attached record: not listed",
          person.timeline?.length ? `${person.timeline.length} linked timeline event(s)` : "No timeline entered yet",
          person.evidenceSummary?.length ? person.evidenceSummary.slice(0, 2).join(" · ") : "Supporting evidence is being organized"
        ].join(" · ")}
        claim={person.keyEvent}
        confidence={person.confidence}
        narrative={person.summary}
      />

      {person.timeline?.length ? (
        <section className="space-y-4 pt-2">
          <div className="archive-section__title">Life &amp; Evidence Timeline</div>
          <Timeline entries={person.timeline} />
        </section>
      ) : null}

      {person.evidenceSummary?.length ? (
        <section className="space-y-4 pt-2">
          <div className="archive-section__title">Evidence Summary</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              {person.evidenceSummary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {person.sarLineStatus ? (
        <section className="space-y-4 pt-2">
          <div className="archive-section__title">
            {isCharlesDyer ? "Confirmed Direct Revolutionary War Line" : "SAR Line Status"}
          </div>
          {isCharlesDyer ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-slate-300">
              Charles Dyer&apos;s Revolutionary War service is supported by the 1778 discharge record, and the descent
              through Jonathan Dyer is documented in the family evidence and census trail.
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Patriot ancestor</div>
              <div className="mt-1 text-slate-100">{person.sarLineStatus.patriotAncestor}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Service</div>
              <div className="mt-1 text-slate-100">{person.sarLineStatus.service}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Key record</div>
              <div className="mt-1 text-slate-100">{person.sarLineStatus.keyRecord}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Status</div>
              <div className="mt-1 text-slate-100">{person.sarLineStatus.status}</div>
            </div>
            {isCharlesDyer ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 md:col-span-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Descent</div>
                <div className="mt-1 text-slate-100">Documented descent through Jonathan Dyer</div>
              </div>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Note</div>
            <div className="mt-1 text-slate-200">{person.sarLineStatus.note}</div>
          </div>
        </section>
      ) : null}

      <Link className="archive-nav__link inline-flex" href="/ancestors">
        Back to ancestor cards
      </Link>
    </section>
  );
}
