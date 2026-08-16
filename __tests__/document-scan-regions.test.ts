import documentsData from "../data/documents.json";
import { DocumentRecord } from "../lib/types/genealogy";

const documents = documentsData as DocumentRecord[];

describe("Document Scan Regions & Deep Citation Schema Integrity", () => {
  const documentsWithRegions = documents.filter(
    (d) => Array.isArray(d.regions) && d.regions.length > 0
  );

  test("documents with regions are defined and present in repository", () => {
    expect(documentsWithRegions.length).toBeGreaterThanOrEqual(3);
  });

  test("every scan region has a unique ID across the entire archive", () => {
    const seenRegionIds = new Set<string>();
    for (const doc of documentsWithRegions) {
      for (const region of doc.regions || []) {
        expect(region.id).toBeDefined();
        expect(region.id.trim().length).toBeGreaterThan(0);
        expect(seenRegionIds.has(region.id)).toBe(false);
        seenRegionIds.add(region.id);
      }
    }
  });

  test("all region bounding boxes have valid normalized 0–100% coordinates and bounds", () => {
    for (const doc of documentsWithRegions) {
      for (const region of doc.regions || []) {
        const { x, y, width, height } = region.bbox;
        expect(Number.isFinite(x)).toBe(true);
        expect(Number.isFinite(y)).toBe(true);
        expect(Number.isFinite(width)).toBe(true);
        expect(Number.isFinite(height)).toBe(true);

        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(width).toBeGreaterThan(0);
        expect(height).toBeGreaterThan(0);

        expect(x + width).toBeLessThanOrEqual(100);
        expect(y + height).toBeLessThanOrEqual(100);
      }
    }
  });

  test("every region carries a non-empty fact assertion and descriptive label", () => {
    for (const doc of documentsWithRegions) {
      for (const region of doc.regions || []) {
        expect(typeof region.label).toBe("string");
        expect(region.label.trim().length).toBeGreaterThan(3);
        expect(typeof region.provesFact).toBe("string");
        expect(region.provesFact.trim().length).toBeGreaterThan(10);
      }
    }
  });
});
