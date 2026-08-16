import peopleData from "../data/people.json";
import { buildFamilyTreeGraph } from "../lib/familyTreeEngine";
import { compareAncestors } from "../lib/ancestorComparator";

describe("Dual Ancestor Comparator Engine", () => {
  const graph = buildFamilyTreeGraph(peopleData);

  test("correctly flags generational and birth-year disparities between distinct namesake ancestors", () => {
    const jr1769 = graph.nodeMap["josiah-ramsey-1769"];
    const jr1834 = graph.nodeMap["josiah-ramsey-1834"];

    expect(jr1769).toBeDefined();
    expect(jr1834).toBeDefined();

    const result = compareAncestors(jr1769, jr1834);

    expect(result.generationDelta).toBeGreaterThanOrEqual(1);
    expect(result.birthYearDelta).toBeGreaterThan(50);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.isSameIndividualCandidate).toBe(false);
  });

  test("correctly computes matching fields on identical/candidate records", () => {
    const sr1728 = graph.nodeMap["josiah-ramsey-sr-1728"];
    expect(sr1728).toBeDefined();

    const result = compareAncestors(sr1728, sr1728);

    expect(result.generationDelta).toBe(0);
    expect(result.birthYearDelta).toBe(0);
    expect(result.conflicts.length).toBe(0);
    expect(result.sharedSpouses.length).toBe(sr1728.spouseIds.length);
  });
});
