import peopleData from "../../data/people.json";
import { AncestorsBrowser } from "../../components/AncestorsBrowser";
import type { AncestorCardProps } from "../../components/AncestorCard";

export const dynamic = "force-dynamic";

const people = peopleData as AncestorCardProps[];

export default function AncestorsPage() {
  return (
    <AncestorsBrowser people={people} />
  );
}
