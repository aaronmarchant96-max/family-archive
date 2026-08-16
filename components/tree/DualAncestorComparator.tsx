"use client";

import React, { useState } from "react";
import { PersonGraphNode } from "../../lib/familyTreeEngine";
import { compareAncestors, AncestorComparisonResult } from "../../lib/ancestorComparator";

interface DualAncestorComparatorProps {
  initialNodeA: PersonGraphNode;
  allNodes: PersonGraphNode[];
  onClose: () => void;
  onSelectNode: (node: PersonGraphNode) => void;
}

export function DualAncestorComparator({
  initialNodeA,
  allNodes,
  onClose,
  onSelectNode
}: DualAncestorComparatorProps) {
  const [nodeA, setNodeA] = useState<PersonGraphNode>(initialNodeA);
  const [nodeBId, setNodeBId] = useState<string>(
    allNodes.find((n) => n.id !== initialNodeA.id)?.id || initialNodeA.id
  );

  const nodeB = allNodes.find((n) => n.id === nodeBId) || initialNodeA;
  const comparison: AncestorComparisonResult = compareAncestors(nodeA, nodeB);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-3xl border border-white/20 bg-[#f4efe7] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(18,20,24,0.1)] bg-white/80 px-6 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--archive-accent)]">
              Engelbartian Synthesis Workbench
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--archive-text)] archive-display">
              Side-by-Side Ancestor Comparator
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {comparison.isSameIndividualCandidate && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 border border-emerald-300 shadow-sm">
                ✓ Candidate Identity Match
              </span>
            )}
            {comparison.conflicts.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 border border-amber-300 shadow-sm">
                ⚠️ {comparison.conflicts.length} Discrepanc{comparison.conflicts.length === 1 ? "y" : "ies"} Detected
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-black/70 hover:bg-black/10"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dossier Selectors */}
        <div className="grid grid-cols-2 gap-4 border-b border-[rgba(18,20,24,0.08)] bg-[#eae3d5] p-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--archive-accent)] mb-1">
              Dossier A (Baseline)
            </label>
            <select
              value={nodeA.id}
              onChange={(e) => {
                const found = allNodes.find((n) => n.id === e.target.value);
                if (found) setNodeA(found);
              }}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-medium text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {allNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.lifespan}) — {node.branch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--archive-accent)] mb-1">
              Dossier B (Comparison Target)
            </label>
            <select
              value={nodeBId}
              onChange={(e) => setNodeBId(e.target.value)}
              className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-medium text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {allNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.lifespan}) — {node.branch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Comparison Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Discrepancy Warnings */}
          {comparison.conflicts.length > 0 && (
            <div className="rounded-2xl border border-amber-400/50 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-sm space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <span>⚠️</span> Genealogical Contradictions & Conflict Notes
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-900/90">
                {comparison.conflicts.map((c, i) => (
                  <li key={i} className="font-medium">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Structured Attributes Diff */}
          <div className="rounded-2xl border border-[rgba(18,20,24,0.1)] bg-white/90 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-black/10 bg-black/5 text-[11px] font-bold uppercase tracking-wider text-[var(--archive-text-soft)]">
                  <th className="py-2.5 px-4 w-1/4">Field</th>
                  <th className="py-2.5 px-4 w-3/8 text-[var(--archive-text)]">{nodeA.name}</th>
                  <th className="py-2.5 px-4 w-3/8 text-[var(--archive-text)]">{nodeB.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {comparison.fields.map((field, i) => (
                  <tr
                    key={i}
                    className={
                      field.isConflict
                        ? "bg-amber-100/50"
                        : field.isMatch
                        ? "bg-emerald-50/40"
                        : "bg-transparent"
                    }
                  >
                    <td className="py-2.5 px-4 font-bold text-[var(--archive-text-soft)]">
                      {field.label}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[var(--archive-text)]">
                      {String(field.valA ?? "—")}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-[var(--archive-text)]">
                      {String(field.valB ?? "—")}
                      {field.notes && (
                        <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
                          {field.notes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Side-by-side Evidence & Summary Panels */}
          <div className="grid grid-cols-2 gap-6">
            {/* Dossier A Detail */}
            <div className="rounded-2xl border border-[rgba(18,20,24,0.1)] bg-white/80 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <h3 className="font-bold text-sm text-[var(--archive-text)]">{nodeA.name}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  {nodeA.confidence}
                </span>
              </div>
              <p className="text-xs text-[var(--archive-text)] leading-relaxed">
                {nodeA.summary || "No summary available."}
              </p>
              {nodeA.sourceCitation && (
                <div className="rounded-xl bg-[#f4efe7] p-2.5 text-[11px] text-[var(--archive-text-soft)] italic border border-black/5">
                  <span className="font-semibold text-black/80 not-italic block mb-0.5">Citation:</span>
                  {nodeA.sourceCitation}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onSelectNode(nodeA);
                  onClose();
                }}
                className="w-full rounded-xl bg-[var(--archive-accent)] text-white py-1.5 text-xs font-semibold hover:opacity-90 shadow-sm"
              >
                Focus {nodeA.name} in Lineage Tree
              </button>
            </div>

            {/* Dossier B Detail */}
            <div className="rounded-2xl border border-[rgba(18,20,24,0.1)] bg-white/80 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <h3 className="font-bold text-sm text-[var(--archive-text)]">{nodeB.name}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  {nodeB.confidence}
                </span>
              </div>
              <p className="text-xs text-[var(--archive-text)] leading-relaxed">
                {nodeB.summary || "No summary available."}
              </p>
              {nodeB.sourceCitation && (
                <div className="rounded-xl bg-[#f4efe7] p-2.5 text-[11px] text-[var(--archive-text-soft)] italic border border-black/5">
                  <span className="font-semibold text-black/80 not-italic block mb-0.5">Citation:</span>
                  {nodeB.sourceCitation}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onSelectNode(nodeB);
                  onClose();
                }}
                className="w-full rounded-xl bg-[var(--archive-accent)] text-white py-1.5 text-xs font-semibold hover:opacity-90 shadow-sm"
              >
                Focus {nodeB.name} in Lineage Tree
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
