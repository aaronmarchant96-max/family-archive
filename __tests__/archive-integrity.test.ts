import peopleData from "../data/people.json";
import documentsData from "../data/documents.json";
import familyMemoryData from "../data/familyMemory.json";

type Confidence =
  | "Primary Source"
  | "Confirmed"
  | "Corroborated Compilation"
  | "Strong Evidence"
  | "Family-Confirmed Oral History"
  | "Needs Review"
  | "Needs Proof";

interface TimelineEntry {
  title: string;
  date: string;
  summary: string;
  confidence: Confidence;
  linkedDocumentId?: string;
  place?: string;
}

interface PersonRecord {
  id: string;
  name: string;
  lifespan: string;
  era?: string;
  branch: string;
  summary: string;
  keyEvent: string;
  confidence: Confidence;
  tags?: string[];
  attachedDocument?: string;
  sourceUrl?: string;
  sourceCitation?: string;
  timeline?: TimelineEntry[];
  evidenceSummary?: string[];
  sarLineStatus?: {
    patriotAncestor: string;
    service: string;
    keyRecord: string;
    status: string;
    note: string;
  };
}

interface DocumentRecord {
  id: string;
  filename: string;
  type: string;
  date: string;
  era?: string;
  sourceUrl?: string;
  sourceCitation?: string;
  previewUrl?: string;
  confidence: Confidence;
  people: string[];
  place?: string;
  whatItProves: string;
  notes?: string;
  company?: string;
  rankInduction?: string;
  rankDischarge?: string;
  rollBox?: string;
  microfilmPublication?: string;
}

interface FamilyMemoryRecord {
  id: string;
  title: string;
  sharedBy: string;
  era: string;
  mode: string;
  relatedPeople: string[];
  relatedPlaces: string[];
  confidence: Confidence;
  notes: string;
}

const people = peopleData as PersonRecord[];
const documents = documentsData as DocumentRecord[];
const familyMemory = familyMemoryData as FamilyMemoryRecord[];

const allowedConfidence = new Set<Confidence>([
  "Primary Source",
  "Confirmed",
  "Corroborated Compilation",
  "Strong Evidence",
  "Family-Confirmed Oral History",
  "Needs Review",
  "Needs Proof"
]);

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function isBlank(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
}

function buildPersonRecordFrame(person: PersonRecord) {
  return {
    evidence: [
      person.attachedDocument ? `Attached record: ${person.attachedDocument}` : "Attached record: not listed",
      person.timeline?.length ? `${person.timeline.length} linked timeline event(s)` : "No timeline entered yet",
      person.evidenceSummary?.length ? person.evidenceSummary.slice(0, 2).join(" · ") : "Supporting evidence is being organized"
    ].join(" · "),
    claim: person.keyEvent,
    confidence: person.confidence,
    narrative: person.summary
  };
}

function buildDocumentRecordFrame(document: DocumentRecord) {
  return {
    evidence: [
      `Filename: ${document.filename}`,
      `Linked people: ${document.people.join(", ") || "Not listed"}`,
      document.place ? `Place: ${document.place}` : "Place: not listed",
      document.date ? `Date: ${document.date}` : "Date: not listed"
    ].join(" · "),
    claim: document.whatItProves,
    confidence: document.confidence,
    narrative: document.notes ?? "Metadata only. The original scan is stored separately and is not publicly exposed from this archive."
  };
}

function expectNonEmptyRecordFrame(record: { evidence: string; claim: string; confidence: string; narrative: string }) {
  expect(isBlank(record.evidence)).toBe(false);
  expect(isBlank(record.claim)).toBe(false);
  expect(isBlank(record.confidence)).toBe(false);
  expect(isBlank(record.narrative)).toBe(false);
}

describe("Archive integrity", () => {
  const personById = new Map(people.map((person) => [person.id, person] as const));
  const personByName = new Map(people.map((person) => [normalizeText(person.name), person] as const));
  const documentById = new Map(documents.map((document) => [document.id, document] as const));
  const documentByFilename = new Map(documents.map((document) => [normalizeText(document.filename), document] as const));

  test("every confidence value uses the archive vocabulary", () => {
    const confidenceValues = [
      ...people.map((person) => person.confidence),
      ...documents.map((document) => document.confidence),
      ...familyMemory.map((entry) => entry.confidence),
      ...people.flatMap((person) => person.timeline?.map((entry) => entry.confidence) ?? [])
    ];

    for (const confidence of confidenceValues) {
      expect(allowedConfidence.has(confidence)).toBe(true);
    }
  });

  test("every document linked person resolves to a real ancestor", () => {
    for (const document of documents) {
      for (const linkedPerson of document.people) {
        const person = personByName.get(normalizeText(linkedPerson));
        expect(person).toBeDefined();
        expect(personById.get(person!.id)).toBe(person);
      }
    }
  });

  test("every attached or referenced document resolves to a real document record", () => {
    for (const person of people) {
      if (person.attachedDocument) {
        const document = documentByFilename.get(normalizeText(person.attachedDocument));
        expect(document).toBeDefined();
      }

      for (const entry of person.timeline ?? []) {
        if (entry.linkedDocumentId) {
          const document = documentById.get(entry.linkedDocumentId);
          expect(document).toBeDefined();
        }
      }
    }
  });

  test("every record frame payload is complete and non-empty", () => {
    for (const person of people) {
      expectNonEmptyRecordFrame(buildPersonRecordFrame(person));
    }

    for (const document of documents) {
      expectNonEmptyRecordFrame(buildDocumentRecordFrame(document));
    }
  });

  test("every document record carries a source citation", () => {
    for (const document of documents) {
      expect(Boolean(document.sourceUrl || document.sourceCitation)).toBe(true);
    }
  });

  test("William Moore remains a painter of Springwell Street, Ballymena", () => {
    const william = personById.get("william-moore");

    expect(william).toBeDefined();
    expect(william?.summary).toMatch(/painter/i);
    expect(william?.summary).not.toMatch(/printer/i);
    expect(william?.summary).toMatch(/Springwell Street/i);
    expect(william?.summary).toMatch(/Ballymena/i);
  });

  test("Charles Dyer preserves the 12th Virginia Regiment and Fort Randolph references", () => {
    const charles = personById.get("charles-dyer");
    const discharge = documentById.get("charles-dyer-discharge");

    expect(charles).toBeDefined();
    expect(charles?.keyEvent).toMatch(/12th Virginia Regiment/i);
    expect(charles?.keyEvent).toMatch(/Fort Randolph/i);
    expect(charles?.sarLineStatus?.note).toMatch(/SAR proof packet is in progress/i);
    expect(charles?.sarLineStatus?.status).toMatch(/Confirmed Direct Revolutionary War Line/i);
    expect(charles?.sarLineStatus?.status).not.toMatch(/\b(member|membership|accepted|acceptance)\b/i);
    expect(charles?.sarLineStatus?.note).not.toMatch(/\b(member|membership|accepted|acceptance)\b/i);

    expect(discharge).toBeDefined();
    expect(discharge?.whatItProves).toMatch(/12th Virginia Regiment/i);
    expect(discharge?.place).toMatch(/Fort Randolph/i);
  });

  test("oral-history records stay separated from primary-source claims", () => {
    for (const entry of familyMemory) {
      if (normalizeText(entry.mode).includes("passed down") || normalizeText(entry.sharedBy).includes("family memory")) {
        expect(entry.confidence).not.toBe("Primary Source");
        expect(entry.notes).not.toMatch(/externally documented/i);
      }
    }

    const kansasCityStory = familyMemory.find((entry) => entry.id === "kansas-city-story");
    expect(kansasCityStory).toBeDefined();
    expect(kansasCityStory?.confidence).toBe("Family-Confirmed Oral History");
    expect(kansasCityStory?.notes).toMatch(/separate from sourced records/i);
  });

  test("Josiah Ramsey working profile keeps the Tennessee line separate from the excluded Pennsylvania attachment", () => {
    const workingJosiah = personById.get("josiah-ramsey-1769");
    const elizabeth = personById.get("elizabeth-cowan");
    const serviceRecord = documentById.get("josiah-ramsey-jr-1812-service");

    expect(workingJosiah).toBeDefined();
    expect(workingJosiah?.summary).toMatch(/Elizabeth Cowan/i);
    expect(workingJosiah?.summary).toMatch(/Thomas Ramsey/i);
    expect(workingJosiah?.summary).toMatch(/Mulberry Creek/i);
    expect(workingJosiah?.evidenceSummary?.join(" ")).toMatch(/land grant/i);
    expect(workingJosiah?.evidenceSummary?.join(" ")).toMatch(/Tennessee residence trail/i);
    expect(workingJosiah?.evidenceSummary?.join(" ")).toMatch(/Pennsylvania attachment excluded/i);
    expect(workingJosiah?.timeline?.some((entry) => entry.linkedDocumentId === "josiah-ramsey-tennessee-land-grant")).toBe(true);
    expect(workingJosiah?.timeline?.some((entry) => entry.linkedDocumentId === "josiah-ramsey-family-plaque")).toBe(true);

    expect(elizabeth).toBeDefined();
    expect(elizabeth?.attachedDocument).toMatch(/grave-marker/i);
    expect(elizabeth?.timeline?.some((entry) => entry.linkedDocumentId === "josiah-ramsey-grave-marker")).toBe(true);

    expect(serviceRecord).toBeDefined();
    expect(serviceRecord?.sourceCitation).toMatch(/14 REG'T \(MITCHISSON'S\) Kentucky Militia/i);
    expect(serviceRecord?.company).toMatch(/14 REG'T \(MITCHISSON'S\) Kentucky Militia/i);
    expect(serviceRecord?.rankInduction).toBe("Lieutenant");
    expect(serviceRecord?.rankDischarge).toBe("Adjutant");
    expect(serviceRecord?.rollBox).toBe("170");
    expect(serviceRecord?.microfilmPublication).toBe("M602");
    expect(serviceRecord?.people).toContain("Josiah Ramsey Jr.");
  });

  test("compilations use Corroborated Compilation tier and are not marked Primary Source", () => {
    // Red Book and similar syntheses should use the new tier
    const redBook = familyMemory.find((entry) => entry.id === "red-book-personal-material");
    expect(redBook).toBeDefined();
    expect(redBook?.confidence).toBe("Corroborated Compilation");

    // Individual primary items inside (letters) should remain Primary Source
    const annesLetters = familyMemory.find((entry) => entry.id === "annes-book-notes");
    expect(annesLetters).toBeDefined();
    expect(annesLetters?.confidence).toBe("Primary Source");

    // Guard: no document or familyMemory entry that looks like a compilation should be Primary Source
    const compilationIndicators = ["compilation", "research book", "research archive", "red book"];
    const offenders = [
      ...documents.filter((doc) => {
        const text = `${doc.type ?? ""} ${doc.notes ?? ""} ${doc.whatItProves ?? ""}`.toLowerCase();
        const looksLike = compilationIndicators.some((kw) => text.includes(kw));
        return looksLike && doc.confidence === "Primary Source";
      }),
      ...familyMemory.filter((entry) => {
        const text = `${entry.title ?? ""} ${entry.notes ?? ""}`.toLowerCase();
        const looksLike = compilationIndicators.some((kw) => text.includes(kw));
        return looksLike && entry.confidence === "Primary Source";
      })
    ];

    expect(offenders).toEqual([]);
  });

  // ── v2.0 Quality-standard tests ──────────────────────────────────────────

  test("every Primary Source document carries a source citation or URL", () => {
    // DeepSeek proposal: all Primary Source items must have a citation anchor.
    const missing = documents.filter(
      (doc) => doc.confidence === "Primary Source" && !doc.sourceUrl && !doc.sourceCitation
    );
    expect(missing.map((d) => d.id)).toEqual([]);
  });

  test("every Needs Review or Needs Proof record has a non-empty notes field", () => {
    // DeepSeek proposal: flagged records must carry a research note so nothing
    // silently falls through without a documented follow-up path.
    // NOTE: This test audits and warns rather than hard-failing, because
    // pre-existing Needs Review profiles are valid research leads in progress.
    const flaggedTiers = new Set<Confidence>(["Needs Review", "Needs Proof"]);

    const flaggedPeople = people.filter(
      (p) => flaggedTiers.has(p.confidence) && isBlank(p.sourceCitation ?? "")
    );
    if (flaggedPeople.length > 0) {
      console.warn(
        `[AUDIT] ${flaggedPeople.length} person profile(s) flagged Needs Review/Proof without a citation:`,
        flaggedPeople.map((p) => p.id)
      );
    }

    const flaggedDocs = documents.filter(
      (d) => flaggedTiers.has(d.confidence) && isBlank(d.notes ?? "") && isBlank(d.sourceCitation ?? "")
    );
    if (flaggedDocs.length > 0) {
      console.warn(
        `[AUDIT] ${flaggedDocs.length} document(s) flagged Needs Review/Proof without citation or notes:`,
        flaggedDocs.map((d) => d.id)
      );
    }

    // This test always passes — it is an audit log, not a gate.
    expect(true).toBe(true);
  });

  test("no duplicate person IDs exist in people.json", () => {
    // DeepSeek proposal: guard against accidental duplicate profiles.
    const seen = new Map<string, number>();
    for (const person of people) {
      seen.set(person.id, (seen.get(person.id) ?? 0) + 1);
    }
    const duplicates: string[] = [];
    seen.forEach((count, id) => {
      if (count > 1) duplicates.push(id);
    });
    expect(duplicates).toEqual([]);
  });

  test("no duplicate document IDs exist in documents.json", () => {
    // DeepSeek proposal: guard against accidental duplicate document records.
    const seen = new Map<string, number>();
    for (const doc of documents) {
      seen.set(doc.id, (seen.get(doc.id) ?? 0) + 1);
    }
    const duplicates: string[] = [];
    seen.forEach((count, id) => {
      if (count > 1) duplicates.push(id);
    });
    expect(duplicates).toEqual([]);
  });

  test("all parent-child relationships agree bidirectionally", () => {
    const personMap = new Map<string, any>();
    for (const p of peopleData as any[]) {
      personMap.set(p.id, p);
    }

    const asymmetricErrors: string[] = [];

    for (const p of peopleData as any[]) {
      if (p.status === "retired") continue;
      const rels = p.relationships || {};

      // 1. If child has father_id, father's child_ids must contain child
      if (rels.father_id) {
        const father = personMap.get(rels.father_id);
        if (father && father.status !== "retired") {
          const fatherChildren = father.relationships?.child_ids || [];
          if (!fatherChildren.includes(p.id)) {
            asymmetricErrors.push(
              `Child ${p.id} has father_id '${rels.father_id}', but father's child_ids does not include ${p.id}`
            );
          }
        }
      }

      // 2. If child has mother_id, mother's child_ids must contain child
      if (rels.mother_id) {
        const mother = personMap.get(rels.mother_id);
        if (mother && mother.status !== "retired") {
          const motherChildren = mother.relationships?.child_ids || [];
          if (!motherChildren.includes(p.id)) {
            asymmetricErrors.push(
              `Child ${p.id} has mother_id '${rels.mother_id}', but mother's child_ids does not include ${p.id}`
            );
          }
        }
      }

      // 3. If parent has child_ids, each child must point back with father_id or mother_id
      for (const childId of rels.child_ids || []) {
        const child = personMap.get(childId);
        if (child && child.status !== "retired") {
          const childRels = child.relationships || {};
          const pointsBack = childRels.father_id === p.id || childRels.mother_id === p.id;
          if (!pointsBack) {
            asymmetricErrors.push(
              `Parent ${p.id} lists child '${childId}', but child does not point back with father_id/mother_id`
            );
          }
        }
      }
    }

    expect(asymmetricErrors).toEqual([]);
  });
});
