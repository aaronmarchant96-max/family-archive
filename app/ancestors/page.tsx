import peopleData from "../../data/people.json";
import { AncestorsBrowser } from "../../components/AncestorsBrowser";
import type { AncestorCardProps } from "../../components/AncestorCard";

const people = peopleData as AncestorCardProps[];

export default function AncestorsPage() {
  return (
    <AncestorsBrowser people={people} />
  );
}
