export interface NodePosition3D {
  x: number;
  y: number;
  z: number;
  isEstimatedDate: boolean;
}

export interface PersonGraphNode {
  id: string;
  name: string;
  lifespan: string;
  birthYear?: number;
  deathYear?: number;
  era?: string;
  branch: string;
  confidence: string;
  summary: string;
  keyEvent: string;
  location?: string;
  tags?: string[];
  attachedDocument?: string;
  sourceCitation?: string;
  sarLineStatus?: any;
  fatherId?: string;
  motherId?: string;
  spouseIds: string[];
  childIds: string[];
  // Graph layout coordinates
  x: number;
  y: number;
  generation: number;
  pos3D?: NodePosition3D;
}

export interface TreeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: "parent-child" | "spouse";
  branch: string;
}

export interface EpochStrata {
  id: string;
  name: string;
  timeRange: string;
  startYear: number;
  endYear: number;
  yStart: number;
  yEnd: number;
  accent: string;
  historicalContext: string;
}

export interface FamilyTreeGraph {
  nodes: PersonGraphNode[];
  nodeMap: Record<string, PersonGraphNode>;
  edges: TreeEdge[];
  epochs: EpochStrata[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    width: number;
    height: number;
  };
  branches: { name: string; count: number; color: string }[];
}

export const BRANCH_COLORS: Record<string, string> = {
  Ramsey: "#d97706", // Amber
  Dyer: "#b91c1c", // Ruby/Red
  Moore: "#059669", // Emerald
  Edwards: "#7c3aed", // Purple
  Bowen: "#2563eb", // Sapphire
  Marchant: "#ea580c", // Orange
  Conlee: "#0d9488", // Teal
  Hopkins: "#c026d3", // Fuchsia
  Clouse: "#ca8a04", // Yellow-gold
  Bower: "#65a30d", // Lime
  Kilker: "#475569", // Slate
  Cowan: "#0891b2", // Cyan
  Law: "#4f46e5", // Indigo
  Cole: "#9333ea", // Violet
  Baker: "#64748b", // Slate
  Morris: "#78716c", // Stone
  Hurst: "#0284c7", // Light blue
  Unknown: "#6b7280"
};

export const EPOCHS: Omit<EpochStrata, "yStart" | "yEnd">[] = [
  {
    id: "colonial",
    name: "Colonial Foundations",
    timeRange: "1620 – 1700",
    startYear: 1620,
    endYear: 1700,
    accent: "rgba(37, 99, 235, 0.08)",
    historicalContext: "Early settlements in Massachusetts Bay & Virginia Colonies"
  },
  {
    id: "pre-revolution",
    name: "Colonial Expansion",
    timeRange: "1700 – 1775",
    startYear: 1700,
    endYear: 1775,
    accent: "rgba(13, 148, 136, 0.08)",
    historicalContext: "Settlements across Delaware, Rhode Island, and Pennsylvania"
  },
  {
    id: "revolution",
    name: "Revolutionary Era & Frontier Grants",
    timeRange: "1775 – 1820",
    startYear: 1775,
    endYear: 1820,
    accent: "rgba(217, 119, 6, 0.08)",
    historicalContext: "North Carolina Militia service & Tennessee Land Grants"
  },
  {
    id: "pioneer",
    name: "Pioneer Trails & Midwest Homesteads",
    timeRange: "1820 – 1880",
    startYear: 1820,
    endYear: 1880,
    accent: "rgba(185, 28, 28, 0.08)",
    historicalContext: "Iowa settlement, Oregon Trail, and Washington Territory"
  },
  {
    id: "migration",
    name: "Transatlantic & Canadian Homesteads",
    timeRange: "1880 – 1940",
    startYear: 1880,
    endYear: 1940,
    accent: "rgba(5, 150, 105, 0.08)",
    historicalContext: "Ballymena Northern Ireland migration & Alberta homesteads"
  },
  {
    id: "modern",
    name: "Modern Living Era",
    timeRange: "1940 – Present",
    startYear: 1940,
    endYear: 2030,
    accent: "rgba(124, 58, 237, 0.08)",
    historicalContext: "Calgary, Western Canada & family records"
  }
];

const NODE_WIDTH = 240;
const NODE_HEIGHT = 100;
const X_GAP = 70;
const LAYER_HEIGHT = 220;
const BASE_YEAR = 1950;
const YEAR_SCALE = 4; // 1 year = 4 units on Z axis in 3D WebGL

/**
 * Extracts a numeric year from integer, string ("c. 1640", "1675-1745"), or null inputs.
 * Guarantees a finite integer year with explicit isEstimated flag.
 */
export function parseBirthYear(rawYear: number | string | null | undefined): { year: number; isEstimated: boolean } {
  if (typeof rawYear === "number" && Number.isFinite(rawYear)) {
    return { year: Math.round(rawYear), isEstimated: false };
  }

  if (typeof rawYear === "string") {
    const match = rawYear.match(/\b(\d{4})\b/);
    if (match) {
      return { year: parseInt(match[1], 10), isEstimated: true };
    }
  }

  // Explicit fallback for completely missing records (mid-point anchor)
  return { year: 1900, isEstimated: true };
}

/**
 * Calculates explicit 3D space coordinates for constellation nodes.
 * Guarantees finite non-NaN coordinates for WebGL rendering pipelines.
 */
export function calculateNodePosition3D(
  node: { birthYear?: number | string | null; generation?: number; lifespan?: string; v2_birth_year?: string },
  branchXOffset: number
): NodePosition3D {
  const { year, isEstimated } = parseBirthYear(node.birthYear || node.v2_birth_year || node.lifespan);

  // Structural check: Ensure finite non-NaN values for WebGL consumption
  const safeGeneration = typeof node.generation === "number" && Number.isFinite(node.generation) ? node.generation : 0;
  const safeBranchOffset = typeof branchXOffset === "number" && Number.isFinite(branchXOffset) ? branchXOffset : 0;

  const x = safeBranchOffset;
  const y = safeGeneration * 120;
  // Z axis maps chronological depth relative to modern era
  const z = (year - BASE_YEAR) * YEAR_SCALE;

  return {
    x,
    y,
    z,
    isEstimatedDate: isEstimated
  };
}

export function buildFamilyTreeGraph(rawPeople: any[]): FamilyTreeGraph {
  const nodeMap: Record<string, PersonGraphNode> = {};
  const branchCounts: Record<string, number> = {};

  // 1. Initialize nodes
  for (const raw of rawPeople) {
    const branch = raw.branch || "Unknown";
    branchCounts[branch] = (branchCounts[branch] || 0) + 1;

    const { year: bYear } = parseBirthYear(raw.v2_birth_year || raw.birthYear || raw.lifespan);
    const { year: dYear } = parseBirthYear(raw.v2_death_year || raw.deathYear || raw.lifespan);

    const rels = raw.relationships || {};
    const fatherId = rels.father_id || "";
    const motherId = rels.mother_id || "";
    const spouseIds = Array.isArray(rels.spouse_ids) ? rels.spouse_ids.filter(Boolean) : [];
    const childIds = Array.isArray(rels.child_ids) ? rels.child_ids.filter(Boolean) : [];
    const location = raw.birth_place || raw.location || raw.residence || (Array.isArray(raw.timeline) && raw.timeline.find((t: any) => t && t.place)?.place) || "";

    nodeMap[raw.id] = {
      id: raw.id,
      name: raw.name,
      lifespan: raw.lifespan || "Date unknown",
      birthYear: bYear,
      deathYear: dYear,
      era: raw.era,
      branch,
      confidence: raw.confidence || "Needs Review",
      summary: raw.summary || "",
      keyEvent: raw.keyEvent || "",
      location: location ? String(location).trim() : undefined,
      tags: raw.tags || [],
      attachedDocument: raw.attachedDocument,
      sourceCitation: raw.sourceCitation,
      sarLineStatus: raw.sarLineStatus,
      fatherId: fatherId || undefined,
      motherId: motherId || undefined,
      spouseIds,
      childIds,
      x: 0,
      y: 0,
      generation: 0
    };
  }

  // 2. Compute generation from birth years and parent relationships
  const determineGeneration = (node: PersonGraphNode): number => {
    if (node.birthYear) {
      if (node.birthYear < 1700) return 0;
      if (node.birthYear < 1750) return 1;
      if (node.birthYear < 1800) return 2;
      if (node.birthYear < 1850) return 3;
      if (node.birthYear < 1900) return 4;
      if (node.birthYear < 1950) return 5;
      return 6;
    }
    // Fallback: parent gen + 1
    if (node.fatherId && nodeMap[node.fatherId]) {
      return determineGeneration(nodeMap[node.fatherId]) + 1;
    }
    if (node.motherId && nodeMap[node.motherId]) {
      return determineGeneration(nodeMap[node.motherId]) + 1;
    }
    return 3; // default mid-generation
  };

  const nodes = Object.values(nodeMap);
  for (const node of nodes) {
    node.generation = determineGeneration(node);
  }

  // 3. Cluster and lay out horizontally by branch and generation
  const branchOrder = ["Bowen", "Hopkins", "Ramsey", "Bower", "Conlee", "Edwards", "Dyer", "Moore", "Marchant"];
  const getBranchIndex = (b: string) => {
    const idx = branchOrder.indexOf(b);
    return idx === -1 ? 99 : idx;
  };

  // Group nodes by generation
  const genGroups: Record<number, PersonGraphNode[]> = {};
  for (const node of nodes) {
    if (!genGroups[node.generation]) genGroups[node.generation] = [];
    genGroups[node.generation].push(node);
  }

  // Sort within each generation by branch group, then by birthYear
  for (const gen in genGroups) {
    genGroups[gen].sort((a, b) => {
      const bDiff = getBranchIndex(a.branch) - getBranchIndex(b.branch);
      if (bDiff !== 0) return bDiff;
      return (a.birthYear || 0) - (b.birthYear || 0);
    });
  }

  // Position nodes in 2D and 3D
  let maxNodesInGen = 0;
  for (const gen in genGroups) {
    maxNodesInGen = Math.max(maxNodesInGen, genGroups[gen].length);
  }

  const canvasWidth = Math.max(2600, maxNodesInGen * (NODE_WIDTH + X_GAP) + 300);

  for (const genStr in genGroups) {
    const gen = parseInt(genStr, 10);
    const row = genGroups[gen];
    const totalRowWidth = row.length * NODE_WIDTH + (row.length - 1) * X_GAP;
    const startX = (canvasWidth - totalRowWidth) / 2;

    row.forEach((node, idx) => {
      node.x = Math.round(startX + idx * (NODE_WIDTH + X_GAP));
      node.y = Math.round(140 + gen * LAYER_HEIGHT);
      // Compute 3D WebGL node coordinates
      node.pos3D = calculateNodePosition3D(node, (idx - row.length / 2) * 160);
    });
  }

  // 4. Build Epoch Strata Y bounds
  const epochs: EpochStrata[] = EPOCHS.map((e, idx) => ({
    ...e,
    yStart: idx === 0 ? 0 : Math.round(80 + idx * LAYER_HEIGHT),
    yEnd: Math.round(80 + (idx + 1) * LAYER_HEIGHT)
  }));

  // 5. Generate edges
  const edges: TreeEdge[] = [];
  const edgeSet = new Set<string>();

  for (const node of nodes) {
    // Parent-child
    if (node.fatherId && nodeMap[node.fatherId]) {
      const edgeKey = `${node.fatherId}->${node.id}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: edgeKey,
          sourceId: node.fatherId,
          targetId: node.id,
          type: "parent-child",
          branch: nodeMap[node.fatherId].branch
        });
      }
    }
    if (node.motherId && nodeMap[node.motherId]) {
      const edgeKey = `${node.motherId}->${node.id}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: edgeKey,
          sourceId: node.motherId,
          targetId: node.id,
          type: "parent-child",
          branch: nodeMap[node.motherId].branch
        });
      }
    }
    // Explicit childIds
    for (const cId of node.childIds) {
      if (nodeMap[cId]) {
        const edgeKey = `${node.id}->${cId}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: edgeKey,
            sourceId: node.id,
            targetId: cId,
            type: "parent-child",
            branch: node.branch
          });
        }
      }
    }
  }

  // 6. Calculate canvas bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = 0;
  let maxY = Math.round(80 + EPOCHS.length * LAYER_HEIGHT + 100);

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
  }

  const branches = Object.entries(branchCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      color: BRANCH_COLORS[name] || "#6b7280"
    }));

  return {
    nodes,
    nodeMap,
    edges,
    epochs,
    bounds: {
      minX: Math.max(0, minX - 100),
      maxX: maxX + 100,
      minY,
      maxY,
      width: Math.max(canvasWidth, maxX + 200),
      height: maxY
    },
    branches
  };
}

/**
 * Computes the full set of connected ancestor and descendant IDs for a given focused node.
 * Includes parents, grandparents, children, grandchildren, and direct spouses.
 */
export function getConnectedLineage(nodeId: string, nodeMap: Record<string, PersonGraphNode>): Set<string> {
  const lineage = new Set<string>();
  if (!nodeId || !nodeMap[nodeId]) return lineage;

  lineage.add(nodeId);

  // Recursive ancestor traversal
  const traceAncestors = (currId: string) => {
    const curr = nodeMap[currId];
    if (!curr) return;
    if (curr.fatherId && nodeMap[curr.fatherId] && !lineage.has(curr.fatherId)) {
      lineage.add(curr.fatherId);
      traceAncestors(curr.fatherId);
    }
    if (curr.motherId && nodeMap[curr.motherId] && !lineage.has(curr.motherId)) {
      lineage.add(curr.motherId);
      traceAncestors(curr.motherId);
    }
  };

  // Recursive descendant traversal
  const traceDescendants = (currId: string) => {
    const curr = nodeMap[currId];
    if (!curr) return;
    const children = curr.childIds || [];
    for (const childId of children) {
      if (nodeMap[childId] && !lineage.has(childId)) {
        lineage.add(childId);
        traceDescendants(childId);
      }
    }
  };

  traceAncestors(nodeId);
  traceDescendants(nodeId);

  // Direct spouses of the focused ancestor
  const active = nodeMap[nodeId];
  if (active && active.spouseIds) {
    for (const spId of active.spouseIds) {
      if (nodeMap[spId]) lineage.add(spId);
    }
  }

  return lineage;
}
