import peopleData from "../data/people.json";
import { buildFamilyTreeGraph } from "../lib/familyTreeEngine";

describe("Family tree graph engine", () => {
  const graph = buildFamilyTreeGraph(peopleData);

  test("processes all ancestors into nodes without loss", () => {
    expect(graph.nodes.length).toBe(peopleData.length);
    expect(Object.keys(graph.nodeMap).length).toBe(peopleData.length);
  });

  test("computes valid non-NaN coordinates for every node", () => {
    for (const node of graph.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(node.generation)).toBe(true);
    }
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
});
