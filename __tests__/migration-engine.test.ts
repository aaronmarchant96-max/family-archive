import placesData from "../data/places.json";
import peopleData from "../data/people.json";
import { PlaceRecord, PersonRecord, ConfidenceTier } from "../lib/types/genealogy";

const places = placesData as PlaceRecord[];
const people = peopleData as PersonRecord[];

const canonicalBranches = new Set<string>(
  people
    .map((p) => p.branch)
    .filter(Boolean)
    .sort()
);

const allowedConfidence = new Set<ConfidenceTier>([
  "Primary Source",
  "Confirmed",
  "Corroborated Compilation",
  "Strong Evidence",
  "Family-Confirmed Oral History",
  "Needs Review",
  "Needs Proof"
]);

describe("Migration Engine & Places Data Integrity", () => {
  test("places dataset contains all 13 verified historical settlement pins", () => {
    expect(places.length).toBe(13);
  });

  test("every place record has unique ID and non-empty name", () => {
    const ids = new Set<string>();
    for (const place of places) {
      expect(place.id).toBeDefined();
      expect(place.id.length).toBeGreaterThan(0);
      expect(ids.has(place.id)).toBe(false);
      ids.add(place.id);
      expect(place.name.trim().length).toBeGreaterThan(0);
    }
  });

  test("every place record has valid finite coordinates within geographic boundaries", () => {
    for (const place of places) {
      expect(Number.isFinite(place.lat)).toBe(true);
      expect(Number.isFinite(place.lng)).toBe(true);
      expect(place.lat).toBeGreaterThanOrEqual(-90);
      expect(place.lat).toBeLessThanOrEqual(90);
      expect(place.lng).toBeGreaterThanOrEqual(-180);
      expect(place.lng).toBeLessThanOrEqual(180);
    }
  });

  test("all place branches strictly match the canonical 19-branch taxonomy in people.json", () => {
    for (const place of places) {
      expect(Array.isArray(place.branches)).toBe(true);
      expect(place.branches.length).toBeGreaterThan(0);
      for (const branch of place.branches) {
        expect(canonicalBranches.has(branch)).toBe(true);
      }
    }
  });

  test("every place record carries valid confidence tier and non-empty source citation", () => {
    for (const place of places) {
      expect(allowedConfidence.has(place.confidence)).toBe(true);
      expect(typeof place.sourceCitation).toBe("string");
      expect(place.sourceCitation.trim().length).toBeGreaterThan(10);
    }
  });

  test("place-delaware-colony carries Needs Review confidence preserving open dispute", () => {
    const de = places.find((p) => p.id === "place-delaware-colony");
    expect(de).toBeDefined();
    expect(de?.confidence).toBe("Needs Review");
    expect(de?.historicalContext).toContain("Alice Bower");
  });
});
