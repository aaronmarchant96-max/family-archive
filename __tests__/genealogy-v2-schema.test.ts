import fs from "fs";
import path from "path";

type Row = Record<string, string>;

const V2_DIR = "/home/potatoking/genealogy_research/v2";
const PEOPLE_JSON = path.join(V2_DIR, "people.json");
const DOCUMENTS_JSON = path.join(V2_DIR, "documents.json");
const FULL_EVENTS_JSON = path.join(V2_DIR, "full_events.json");
const CANONICAL_EVENTS_JSON = path.join(V2_DIR, "canonical_events.json");
const REVIEW_EVENTS_JSON = path.join(V2_DIR, "review_events.json");
const LOCKED_FACTS = path.join(V2_DIR, "locked_facts.json");
const CHRONOLOGY_EXCEPTIONS = path.join(V2_DIR, "chronology_exceptions.json");

function yearFromText(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(1[0-9]{3}|20[0-9]{2})/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function splitPipe(value: string | undefined): string[] {
  return (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function textMatches(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.every((keyword) => lower.includes(keyword.toLowerCase()));
}

describe("Genealogy V2 schema", () => {
  expect(fs.existsSync(path.join(V2_DIR, "people.csv"))).toBe(true);
  expect(fs.existsSync(path.join(V2_DIR, "documents.csv"))).toBe(true);
  expect(fs.existsSync(path.join(V2_DIR, "timeline.csv"))).toBe(true);
  expect(fs.existsSync(FULL_EVENTS_JSON)).toBe(true);
  expect(fs.existsSync(CANONICAL_EVENTS_JSON)).toBe(true);
  expect(fs.existsSync(REVIEW_EVENTS_JSON)).toBe(true);

  const people = JSON.parse(fs.readFileSync(PEOPLE_JSON, "utf8")) as Row[];
  const documents = JSON.parse(fs.readFileSync(DOCUMENTS_JSON, "utf8")) as Row[];
  const lockedFacts = JSON.parse(fs.readFileSync(LOCKED_FACTS, "utf8")) as Array<{
    entity: string;
    id: string;
    field: string;
    must_include: string[];
    must_exclude: string[];
  }>;
  const chronologyExceptions = new Set<string>(
    JSON.parse(fs.readFileSync(CHRONOLOGY_EXCEPTIONS, "utf8")).map((entry: { person_id: string }) => entry.person_id)
  );

  const peopleById = new Map(people.map((row) => [row.person_id, row]));
  const peopleByName = new Map(people.map((row) => [row.name.toLowerCase(), row]));

  test("chronological plausibility stays inside human bounds", () => {
    const failures: string[] = [];

    for (const child of people) {
      if (chronologyExceptions.has(child.person_id)) continue;
      const childBirth = yearFromText(child.birth_year) ?? yearFromText(child.birth);
      if (!childBirth) continue;

      const father = child.father_id ? peopleById.get(child.father_id) : undefined;
      const mother = child.mother_id ? peopleById.get(child.mother_id) : undefined;

      for (const [role, parent, minAge, maxAge] of [
        ["father", father, 13, 80],
        ["mother", mother, 13, 55]
      ] as const) {
        if (!parent) continue;
        if (chronologyExceptions.has(parent.person_id)) continue;
        const parentBirth = yearFromText(parent.birth_year) ?? yearFromText(parent.birth);
        const parentDeath = yearFromText(parent.death_year) ?? yearFromText(parent.death);
        if (!parentBirth) continue;

        const age = childBirth - parentBirth;
        if (age < minAge || age > maxAge) {
          failures.push(`${child.person_id}:${role}:${parent.name}:${age}`);
        }

        if (parentDeath && childBirth - parentDeath > 1) {
          failures.push(`${child.person_id}:${role}:${parent.name}:deceased-before-birth`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  test("record type and extracted snippet stay aligned", () => {
    const failures: string[] = [];

    for (const document of documents) {
      const type = document.type ?? "";
      const snippet = document.extracted_snippet ?? "";
      const lowered = `${type} ${snippet}`.toLowerCase();

      if (!snippet) {
        failures.push(`${document.document_id}: missing extracted_snippet`);
        continue;
      }

      const rules: Array<{ match: RegExp; keywords: string[] }> = [
        { match: /marriage/i, keywords: ["marriage"] },
        { match: /census/i, keywords: ["census"] },
        { match: /service|military|militia|attestation/i, keywords: ["service", "militia", "attestation", "military"] },
        { match: /obituary/i, keywords: ["obituary"] },
        { match: /birth/i, keywords: ["birth", "born"] },
        { match: /certificate/i, keywords: ["certificate"] },
        { match: /directory/i, keywords: ["directory"] },
        { match: /burial|grave|cemetery/i, keywords: ["burial", "cemetery", "grave"] }
      ];

      const rule = rules.find((entry) => entry.match.test(type));
      if (rule && !rule.keywords.some((keyword) => lowered.includes(keyword))) {
        failures.push(`${document.document_id}: ${type} lacks ${rule.keywords.join("/")}`);
      }

      if (/painter/i.test(snippet) && !/painting|painter|marriage|certificate/i.test(type)) {
        failures.push(`${document.document_id}: painter drift`);
      }
      if (/printer/i.test(snippet) && /painter/i.test(snippet)) {
        failures.push(`${document.document_id}: printer/painter conflict`);
      }
    }

    expect(failures).toEqual([]);
  });

  test("locked facts remain consistent with verified text", () => {
    const failures: string[] = [];
    for (const fact of lockedFacts) {
      const source = fact.entity === "person"
        ? peopleById.get(fact.id)
        : documents.find((row) => row.document_id === fact.id);
      if (!source) {
        failures.push(`${fact.entity}:${fact.id}: missing record`);
        continue;
      }

      const text = String(source[fact.field as keyof typeof source] ?? "");
      for (const keyword of fact.must_include) {
        if (!textMatches(text, [keyword])) {
          failures.push(`${fact.entity}:${fact.id}:${fact.field}: missing ${keyword}`);
        }
      }
      for (const keyword of fact.must_exclude) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          failures.push(`${fact.entity}:${fact.id}:${fact.field}: contains ${keyword}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
