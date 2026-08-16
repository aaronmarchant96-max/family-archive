import familyMemoryData from "../data/familyMemory.json";
import documentsData from "../data/documents.json";
import peopleData from "../data/people.json";
import { HomeArchiveExplorer } from "../components/HomeArchiveExplorer";
import type { AncestorCardProps } from "../components/AncestorCard";
import type { DocumentCardProps } from "../components/DocumentCard";
import type { FamilyMemoryEntry } from "../components/MemoryCard";

export const dynamic = "force-dynamic";

const people = peopleData as AncestorCardProps[];
const documents = documentsData as DocumentCardProps[];
const familyMemory = familyMemoryData as FamilyMemoryEntry[];

function extractYears(value: unknown): number[] {
  if (typeof value === "number") {
    return [value];
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .match(/\d{4}/g)
    ?.map((year) => Number.parseInt(year, 10))
    .filter((year) => Number.isFinite(year)) ?? [];
}

function getYearBounds() {
  const years: number[] = [];

  for (const person of people) {
    years.push(...extractYears(person.lifespan));
    for (const entry of person.timeline ?? []) {
      years.push(...extractYears(entry.date), ...extractYears(entry.place), ...extractYears(entry.summary));
    }
  }

  for (const document of documents) {
    years.push(...extractYears(document.date), ...extractYears(document.place), ...extractYears(document.era));
  }

  const memoryYears: Record<string, number> = {
    "kansas-city-story": 1900,
    "red-book-personal-material": 1985,
    "annes-book-notes": 2015
  };

  for (const entry of familyMemory) {
    years.push(memoryYears[entry.id] ?? 0);
  }

  const filteredYears = years.filter((year) => year > 0);
  return {
    minYear: filteredYears.length ? Math.min(...filteredYears) : 1700,
    maxYear: filteredYears.length ? Math.max(...filteredYears) : 2026
  };
}

export default function HomePage() {
  const { minYear, maxYear } = getYearBounds();

  return (
    <HomeArchiveExplorer
      people={people}
      documents={documents}
      familyMemory={familyMemory}
      minYear={minYear}
      maxYear={maxYear}
    />
  );
}
