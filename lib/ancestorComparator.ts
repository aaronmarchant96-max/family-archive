import { PersonGraphNode } from "./familyTreeEngine";

export interface ComparisonDiffField {
  label: string;
  valA: string | number | undefined | null;
  valB: string | number | undefined | null;
  isMatch: boolean;
  isConflict: boolean;
  notes?: string;
}

export interface AncestorComparisonResult {
  nodeA: PersonGraphNode;
  nodeB: PersonGraphNode;
  isSameIndividualCandidate: boolean;
  generationDelta: number;
  birthYearDelta: number | null;
  fields: ComparisonDiffField[];
  sharedSpouses: string[];
  sharedChildren: string[];
  conflicts: string[];
}

export function compareAncestors(
  nodeA: PersonGraphNode,
  nodeB: PersonGraphNode
): AncestorComparisonResult {
  const fields: ComparisonDiffField[] = [];
  const conflicts: string[] = [];

  // 1. Generation & Era
  const genDelta = Math.abs(nodeA.generation - nodeB.generation);
  fields.push({
    label: "Generation",
    valA: `Gen ${nodeA.generation + 1}`,
    valB: `Gen ${nodeB.generation + 1}`,
    isMatch: nodeA.generation === nodeB.generation,
    isConflict: genDelta > 1,
    notes: genDelta > 1 ? "Generational gap indicates distinct individuals or generational collapse" : undefined
  });

  // 2. Lifespan & Birth Years
  const bYearA = nodeA.birthYear;
  const bYearB = nodeB.birthYear;
  let birthYearDelta: number | null = null;
  if (bYearA && bYearB) {
    birthYearDelta = Math.abs(bYearA - bYearB);
    const isConflict = birthYearDelta > 15;
    if (isConflict) {
      conflicts.push(`Birth years differ by ${birthYearDelta} years (${bYearA} vs ${bYearB})`);
    }
    fields.push({
      label: "Birth Year",
      valA: bYearA,
      valB: bYearB,
      isMatch: birthYearDelta === 0,
      isConflict,
      notes: isConflict ? `Disparity of ${birthYearDelta} years` : undefined
    });
  } else {
    fields.push({
      label: "Lifespan",
      valA: nodeA.lifespan,
      valB: nodeB.lifespan,
      isMatch: nodeA.lifespan === nodeB.lifespan,
      isConflict: false
    });
  }

  // 3. Branch
  const branchMatch = nodeA.branch === nodeB.branch;
  fields.push({
    label: "Branch",
    valA: nodeA.branch,
    valB: nodeB.branch,
    isMatch: branchMatch,
    isConflict: false
  });

  // 4. Parents
  const fatherMatch = Boolean(nodeA.fatherId && nodeB.fatherId && nodeA.fatherId === nodeB.fatherId);
  const motherMatch = Boolean(nodeA.motherId && nodeB.motherId && nodeA.motherId === nodeB.motherId);
  if (nodeA.fatherId && nodeB.fatherId && nodeA.fatherId !== nodeB.fatherId) {
    conflicts.push(`Different fathers (${nodeA.fatherId} vs ${nodeB.fatherId})`);
  }

  fields.push({
    label: "Father ID",
    valA: nodeA.fatherId || "Unknown",
    valB: nodeB.fatherId || "Unknown",
    isMatch: fatherMatch,
    isConflict: Boolean(nodeA.fatherId && nodeB.fatherId && nodeA.fatherId !== nodeB.fatherId)
  });

  fields.push({
    label: "Mother ID",
    valA: nodeA.motherId || "Unknown",
    valB: nodeB.motherId || "Unknown",
    isMatch: motherMatch,
    isConflict: Boolean(nodeA.motherId && nodeB.motherId && nodeA.motherId !== nodeB.motherId)
  });

  // 5. Shared Spouses & Children
  const spousesA = new Set(nodeA.spouseIds || []);
  const sharedSpouses = (nodeB.spouseIds || []).filter((s) => spousesA.has(s));

  const childrenA = new Set(nodeA.childIds || []);
  const sharedChildren = (nodeB.childIds || []).filter((c) => childrenA.has(c));

  // Determine candidate match heuristic
  const isSameIndividualCandidate =
    birthYearDelta !== null &&
    birthYearDelta <= 5 &&
    (nodeA.name.toLowerCase() === nodeB.name.toLowerCase() ||
      (nodeA.aliases || []).some((a) => a.toLowerCase() === nodeB.name.toLowerCase())) &&
    (fatherMatch || motherMatch || sharedSpouses.length > 0);

  return {
    nodeA,
    nodeB,
    isSameIndividualCandidate,
    generationDelta: genDelta,
    birthYearDelta,
    fields,
    sharedSpouses,
    sharedChildren,
    conflicts
  };
}
