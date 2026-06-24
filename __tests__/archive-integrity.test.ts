import people from "../data/people.json";
import documents from "../data/documents.json";
import familyMemory from "../data/familyMemory.json";

type Person = (typeof people)[number];
type DocumentRecord = (typeof documents)[number];

const allowedConfidence = new Set([
  "Primary Source",
  "Confirmed",
  "Strong Evidence",
  "Family-Confirmed Oral History",
  "Needs Review",
  "Needs Proof"
]);

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function buildPersonRecordFrame(person: Person) {
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

function isBlank(value: unknown) {
  return typeof value !== "string" || value.trim().length === 0;
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
        if (!person) {
          throw new Error(`Document ${document.id} links missing person ${linkedPerson}`);
        }
        if (personById.get(person.id) !== person) {
          throw new Error(`Document ${document.id} linked person ${linkedPerson} does not resolve to the expected person id`);
        }
      }
    }
  });

  test("every attached or referenced document resolves to a real document record", () => {
    for (const person of people) {
      if (person.attachedDocument) {
        const document = documentByFilename.get(normalizeText(person.attachedDocument));
        if (!document) {
          throw new Error(`Person ${person.id} references missing attached document ${person.attachedDocument}`);
        }
      }

      for (const entry of person.timeline ?? []) {
        if (entry.linkedDocumentId) {
          const document = documentById.get(entry.linkedDocumentId);
          if (!document) {
            throw new Error(`Person ${person.id} timeline links missing document id ${entry.linkedDocumentId}`);
          }
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
    expect(charles?.sarLineStatus?.note).toMatch(/proof packet in progress/i);
    expect(charles?.sarLineStatus?.status).toMatch(/Patriot line/i);
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
});
