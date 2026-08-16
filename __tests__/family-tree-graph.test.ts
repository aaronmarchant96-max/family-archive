import peopleData from "../data/people.json";
import {
  buildFamilyTreeGraph,
  getConnectedLineage,
  parseBirthYear,
  calculateNodePosition3D
} from "../lib/familyTreeEngine";

describe("Family tree graph engine", () => {
  const graph = buildFamilyTreeGraph(peopleData);

  test("processes all ancestors into nodes without loss", () => {
    expect(graph.nodes.length).toBe(peopleData.length);
    expect(Object.keys(graph.nodeMap).length).toBe(peopleData.length);
  });

  test("computes valid non-NaN 2D coordinates for every node", () => {
    for (const node of graph.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(node.generation)).toBe(true);
    }
  });

  test("computes valid non-NaN 3D WebGL coordinates for every node", () => {
    for (const node of graph.nodes) {
      expect(node.pos3D).toBeDefined();
      expect(Number.isFinite(node.pos3D!.x)).toBe(true);
      expect(Number.isFinite(node.pos3D!.y)).toBe(true);
      expect(Number.isFinite(node.pos3D!.z)).toBe(true);
      expect(typeof node.pos3D!.isEstimatedDate).toBe("boolean");
    }
  });

  test("parseBirthYear correctly parses numeric, approximate, and null year strings", () => {
    expect(parseBirthYear(1728)).toEqual({ year: 1728, isEstimated: false });
    expect(parseBirthYear("1675-1745")).toEqual({ year: 1675, isEstimated: true });
    expect(parseBirthYear("c. 1640")).toEqual({ year: 1640, isEstimated: true });
    expect(parseBirthYear("Unknown")).toEqual({ year: 1900, isEstimated: true });
    expect(parseBirthYear(null)).toEqual({ year: 1900, isEstimated: true });
    expect(parseBirthYear(undefined)).toEqual({ year: 1900, isEstimated: true });
  });

  test("calculateNodePosition3D generates finite coordinates with temporal Z depth", () => {
    const pos = calculateNodePosition3D(
      { birthYear: "1775", generation: 2 },
      200
    );
    expect(pos.x).toBe(200);
    expect(pos.y).toBe(240);
    // (1775 - 1950) * 4 = -700
    expect(pos.z).toBe(-700);
    expect(pos.isEstimatedDate).toBe(true);
  });

  test("every edge connects existing source and target nodes", () => {
    expect(graph.edges.length).toBeGreaterThan(0);
    for (const edge of graph.edges) {
      expect(graph.nodeMap[edge.sourceId]).toBeDefined();
      expect(graph.nodeMap[edge.targetId]).toBeDefined();
    }
  });

  test("defines all 6 chronological epoch strata with contiguous bounds", () => {
    expect(graph.epochs.length).toBe(6);
    for (let i = 0; i < graph.epochs.length; i++) {
      const ep = graph.epochs[i];
      expect(ep.yEnd).toBeGreaterThan(ep.yStart);
      if (i > 0) {
        expect(ep.yStart).toBe(graph.epochs[i - 1].yEnd);
      }
    }
  });

  test("computes valid positive canvas bounds", () => {
    expect(graph.bounds.width).toBeGreaterThan(1000);
    expect(graph.bounds.height).toBeGreaterThan(500);
  });

  test("getConnectedLineage traces multi-generational ancestor and descendant chains", () => {
    const lineage = getConnectedLineage("josiah-ramsey-1769", graph.nodeMap);
    expect(lineage.has("josiah-ramsey-1769")).toBe(true);
    // Ancestors: father Thomas Ramsey (before 1805) and grandfather Josiah Ramsey Sr. (1728)
    expect(lineage.has("thomas-ramsey-before-1805")).toBe(true);
    expect(lineage.has("josiah-ramsey-sr-1728")).toBe(true);
    // Descendants: son Thomas Ramsey (1799) and granddaughter Armina Ramsey
    expect(lineage.has("thomas-ramsey-1799")).toBe(true);
    expect(lineage.has("armina-ramsey")).toBe(true);
    // Spouse: Elizabeth Cowan
    expect(lineage.has("elizabeth-cowan")).toBe(true);
  });

  test("populates location metadata on nodes from historical records", () => {
    const sr = graph.nodeMap["josiah-ramsey-sr-1728"];
    expect(sr).toBeDefined();
    expect(sr.location).toBeDefined();
    expect(sr.location).toContain("Delaware");
  });

  test("aligns Thomas Ramsey (before 1805) to Generation 2 (Gen 3 display)", () => {
    const tr = graph.nodeMap["thomas-ramsey-before-1805"];
    expect(tr).toBeDefined();
    expect(tr.generation).toBe(2); // 0-indexed: Gen 1 (0), Gen 2 (1), Gen 3 (2)
  });
});
