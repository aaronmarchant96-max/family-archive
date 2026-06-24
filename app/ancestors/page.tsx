import peopleData from "../../data/people.json";
import { AncestorCard, type AncestorCardProps } from "../../components/AncestorCard";

const people = peopleData as AncestorCardProps[];

export default function AncestorsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="archive-panel">
        <div className="archive-kicker">Ancestors</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Ancestor cards</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Simple cards for names, lifespans, branches, key events, and confidence notes. Click a card for a record
          preview placeholder.
        </p>
      </div>
      <div className="archive-grid">
        {people.length ? (
          people.map((person) => <AncestorCard key={person.id} {...person} />)
        ) : (
          <div className="archive-empty">
            No ancestor records loaded yet. Add a person with a branch, summary, key event, and evidence note to
            `data/people.json`.
          </div>
        )}
      </div>
    </section>
  );
}
