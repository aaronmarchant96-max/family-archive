"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  buildFamilyTreeGraph,
  BRANCH_COLORS,
  type PersonGraphNode,
  type FamilyTreeGraph,
  type EpochStrata
} from "../../lib/familyTreeEngine";
import { ConfidenceBadge } from "../ConfidenceBadge";
import { SourcePreview } from "../SourcePreview";
import { ContributeModal } from "../contribute/ContributeModal";

interface FamilyTreeViewerProps {
  rawPeople: any[];
  documents: Array<{ id: string; filename: string; previewUrl?: string; sourceCitation?: string }>;
}

export function FamilyTreeViewer({ rawPeople, documents }: FamilyTreeViewerProps) {
  const graph = useMemo<FamilyTreeGraph>(() => buildFamilyTreeGraph(rawPeople), [rawPeople]);

  // Viewport transformation state
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction state
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNode, setActiveNode] = useState<PersonGraphNode | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [showMinimapMobile, setShowMinimapMobile] = useState(false);
  const [activeEpochId, setActiveEpochId] = useState<string>("colonial");
  const [isContributeOpen, setIsContributeOpen] = useState(false);

  // Search filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return graph.nodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.branch.toLowerCase().includes(q) || n.lifespan.includes(q)
    ).slice(0, 8);
  }, [searchQuery, graph.nodes]);

  // Center on specific node
  const focusNode = useCallback((node: PersonGraphNode) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const isMobile = clientWidth < 640;
    const targetZoom = isMobile ? 0.95 : 1.05;
    const targetX = clientWidth / 2 - (node.x + 120) * targetZoom;
    const targetY = (isMobile ? clientHeight * 0.32 : clientHeight / 2) - (node.y + 50) * targetZoom;
    setZoom(targetZoom);
    setPan({ x: targetX, y: targetY });
    setHighlightedNodeId(node.id);
    setActiveNode(node);
    setSearchQuery("");
  }, []);

  // Jump to specific historical epoch
  const jumpToEpoch = useCallback((epoch: EpochStrata) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const isMobile = clientWidth < 640;
    const targetZoom = isMobile ? 0.65 : 0.8;
    const targetX = (clientWidth - graph.bounds.width * targetZoom) / 2;
    const targetY = clientHeight * 0.2 - epoch.yStart * targetZoom;
    setZoom(targetZoom);
    setPan({ x: targetX, y: targetY });
    setActiveEpochId(epoch.id);
  }, [graph.bounds.width]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".tree-interactive-node") || (e.target as HTMLElement).closest(".tree-ui-control")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan & pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".tree-interactive-node") || (e.target as HTMLElement).closest(".tree-ui-control")) {
      return;
    }
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan({
        x: dragStartRef.current.panX + dx,
        y: dragStartRef.current.panY + dy
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const scaleDelta = currentDist / touchDistanceRef.current;
      touchDistanceRef.current = currentDist;
      setZoom((prev) => Math.min(Math.max(prev * scaleDelta, 0.35), 2.2));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.2);
    setZoom(newZoom);
  };

  // Reset / Initial View: Centered nicely on the earliest generation
  const resetView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const isMobile = clientWidth < 640;
    const initialZoom = isMobile ? 0.6 : 0.75;
    setZoom(initialZoom);
    setPan({
      x: (clientWidth - graph.bounds.width * initialZoom) / 2,
      y: isMobile ? 30 : 50
    });
    setSelectedBranch("");
    setHighlightedNodeId(null);
    setActiveEpochId("colonial");
  }, [graph.bounds.width]);

  useEffect(() => {
    resetView();
  }, [resetView]);

  // Attached document lookup for active node
  const activeDocument = useMemo(() => {
    if (!activeNode?.attachedDocument) return null;
    return documents.find(
      (d) => d.filename.toLowerCase() === activeNode.attachedDocument?.toLowerCase()
    );
  }, [activeNode, documents]);

  return (
    <div className="relative flex flex-col gap-4 pb-16 sm:pb-4">
      {/* Top Header & Search Control Center */}
      <div className="archive-panel space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="archive-kicker">Interactive Constellation</div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
              Family Lineage Tree
            </h1>
            <p className="max-w-3xl text-xs sm:text-sm leading-5 sm:leading-6 text-[var(--archive-text-soft)]">
              Pan, pinch to zoom, and explore 7 generations across historical epochs. Tap any ancestor to inspect verified evidence and relationships.
            </p>
          </div>

          {/* Desktop Zoom & View Controls */}
          <div className="tree-ui-control hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
              aria-label="Zoom in"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 text-base font-semibold text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.35))}
              aria-label="Zoom out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 text-base font-semibold text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Search Input with Autocomplete */}
        <div className="relative">
          <label className="block">
            <span className="sr-only">Search family tree</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, branch, or year to jump to ancestor..."
              className="w-full rounded-2xl border border-[rgba(18,20,24,0.12)] bg-white/80 px-4 py-3 text-sm text-[var(--archive-text)] outline-none placeholder:text-[var(--archive-text-soft)] shadow-sm focus:border-[rgba(127,29,45,0.5)] focus:ring-2 focus:ring-[rgba(127,29,45,0.12)]"
            />
          </label>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(18,20,24,0.08)] text-xs text-[var(--archive-text-soft)] hover:bg-[rgba(18,20,24,0.16)]"
            >
              ✕
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-[rgba(18,20,24,0.12)] bg-white p-2 shadow-2xl">
              {searchResults.map((node) => (
                <div
                  key={node.id}
                  onClick={() => focusNode(node)}
                  className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm text-[var(--archive-text)] transition hover:bg-[rgba(127,29,45,0.06)] active:bg-[rgba(127,29,45,0.12)]"
                >
                  <div>
                    <span className="font-semibold">{node.name}</span>{" "}
                    <span className="text-xs text-[var(--archive-text-soft)]">({node.lifespan})</span>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: BRANCH_COLORS[node.branch] || "#6b7280" }}
                  >
                    {node.branch}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Historical Epoch Jump Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold text-[var(--archive-text)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--archive-text-soft)] mr-1 shrink-0">
            Jump to Era:
          </span>
          {graph.epochs.map((epoch) => (
            <button
              key={epoch.id}
              type="button"
              onClick={() => jumpToEpoch(epoch)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition shrink-0 ${
                activeEpochId === epoch.id
                  ? "border-[rgba(127,29,45,0.5)] bg-[rgba(127,29,45,0.15)] text-[var(--archive-accent)] font-semibold shadow-sm"
                  : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)] hover:bg-white"
              }`}
            >
              {epoch.name} <span className="text-[10px] opacity-60">({epoch.timeRange})</span>
            </button>
          ))}
        </div>

        {/* Branch Filter Horizontal Scroll Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedBranch("")}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition shrink-0 ${
              !selectedBranch
                ? "border-[rgba(127,29,45,0.4)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)] hover:bg-white"
            }`}
          >
            All Branches ({graph.nodes.length})
          </button>
          {graph.branches.slice(0, 10).map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => setSelectedBranch(selectedBranch === b.name ? "" : b.name)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold transition shrink-0 ${
                selectedBranch === b.name
                  ? "border-[rgba(127,29,45,0.4)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                  : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)] hover:bg-white"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
              <span>{b.name}</span>
              <span className="text-[10px] opacity-70">({b.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className={`relative h-[68vh] min-h-[500px] sm:h-[750px] w-full overflow-hidden rounded-[2rem] border border-[rgba(18,20,24,0.12)] bg-[#12151a] shadow-inner select-none touch-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: graph.bounds.width,
            height: graph.bounds.height
          }}
          className="absolute left-0 top-0 transition-transform duration-75 ease-out"
        >
          {/* 1. Historical Epoch Strata Background Bands */}
          {graph.epochs.map((epoch) => (
            <div
              key={epoch.id}
              style={{
                position: "absolute",
                top: epoch.yStart,
                left: 0,
                width: graph.bounds.width,
                height: epoch.yEnd - epoch.yStart,
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: epoch.accent
              }}
              className="pointer-events-none flex flex-col justify-start p-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-lg sm:text-xl font-semibold tracking-wide text-[#e1d8cb]/90">
                  {epoch.name}
                </span>
                <span className="text-xs font-mono font-medium tracking-wider text-[#e1d8cb]/60">
                  {epoch.timeRange}
                </span>
              </div>
              <span className="text-xs text-[#e1d8cb]/50 mt-0.5">{epoch.historicalContext}</span>
            </div>
          ))}

          {/* 2. SVG Relationship Edges */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: graph.bounds.width,
              height: graph.bounds.height,
              pointerEvents: "none"
            }}
          >
            {graph.edges.map((edge) => {
              const source = graph.nodeMap[edge.sourceId];
              const target = graph.nodeMap[edge.targetId];
              if (!source || !target) return null;

              const isHighlighted =
                !selectedBranch ||
                source.branch === selectedBranch ||
                target.branch === selectedBranch;

              const sx = source.x + 120;
              const sy = source.y + 100;
              const tx = target.x + 120;
              const ty = target.y;

              const midY = (sy + ty) / 2;
              const pathD = `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;

              return (
                <path
                  key={edge.id}
                  d={pathD}
                  fill="none"
                  stroke={
                    isHighlighted
                      ? BRANCH_COLORS[source.branch] || "rgba(225, 216, 203, 0.4)"
                      : "rgba(255, 255, 255, 0.05)"
                  }
                  strokeWidth={isHighlighted ? 2.5 : 1}
                  strokeDasharray={edge.type === "spouse" ? "4,4" : undefined}
                  opacity={isHighlighted ? 0.75 : 0.15}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* 3. Ancestor Nodes */}
          {graph.nodes.map((node) => {
            const isBranchMatch = !selectedBranch || node.branch === selectedBranch;
            const isSelected = activeNode?.id === node.id;
            const isHighlighted = highlightedNodeId === node.id;

            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNode(node);
                }}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: 240,
                  height: 100,
                  opacity: isBranchMatch ? 1 : 0.22
                }}
                className={`tree-interactive-node group flex cursor-pointer flex-col justify-between rounded-2xl border p-3 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-95 ${
                  isSelected
                    ? "border-[var(--archive-accent)] bg-[#f4efe7] text-[var(--archive-text)] ring-4 ring-[rgba(127,29,45,0.3)]"
                    : isHighlighted
                    ? "border-amber-400 bg-[#f4efe7] text-[var(--archive-text)] ring-2 ring-amber-400"
                    : "border-[rgba(255,255,255,0.12)] bg-[#181d24] text-[#e1d8cb] hover:border-[rgba(225,216,203,0.4)]"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
                    style={{ backgroundColor: BRANCH_COLORS[node.branch] || "#6b7280" }}
                  >
                    {node.branch}
                  </span>
                  <ConfidenceBadge label={node.confidence} />
                </div>

                <div className="truncate font-semibold tracking-tight leading-tight text-sm">
                  {node.name}
                </div>

                <div className="flex items-center justify-between text-[11px] opacity-75">
                  <span>{node.lifespan}</span>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--archive-accent-soft)]">
                    Gen {node.generation + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Canvas Controls */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0c1015]/85 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[#f4efe7] hover:bg-white/20 active:scale-95"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.35))}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[#f4efe7] hover:bg-white/20 active:scale-95"
          >
            −
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset viewport"
            className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#e1d8cb] hover:text-white"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowMinimapMobile((prev) => !prev)}
            className="sm:hidden px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200 border-l border-white/10"
          >
            {showMinimapMobile ? "Hide Map" : "Radar"}
          </button>
        </div>

        {/* Minimap Radar Overlay */}
        <div
          className={`pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1.5 transition ${
            showMinimapMobile ? "block" : "hidden sm:flex"
          }`}
        >
          <div className="rounded-xl border border-white/10 bg-[#0c1015]/85 p-2 shadow-2xl backdrop-blur-md">
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-[#e1d8cb]/60">
              Minimap Radar
            </div>
            <div
              style={{ width: 140, height: 80 }}
              className="relative overflow-hidden rounded-lg bg-[#141a22]"
            >
              {graph.nodes.map((node) => {
                const mx = (node.x / graph.bounds.width) * 140;
                const my = (node.y / graph.bounds.height) * 80;
                return (
                  <div
                    key={`mini-${node.id}`}
                    style={{
                      position: "absolute",
                      left: mx,
                      top: my,
                      width: 2.5,
                      height: 2.5,
                      backgroundColor: BRANCH_COLORS[node.branch] || "#6b7280"
                    }}
                    className="rounded-full"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Inspector Drawer (Bottom Sheet on Mobile, Slide-out on Desktop) */}
      {activeNode && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] w-full flex-col rounded-t-[2rem] border-t border-[rgba(18,20,24,0.15)] bg-[#f4efe7] p-5 sm:p-6 shadow-2xl overflow-y-auto sm:inset-y-0 sm:right-0 sm:left-auto sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0 animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          {/* Mobile Sheet Drag Handle Indicator */}
          <div className="sm:hidden mx-auto mb-3 h-1.5 w-12 rounded-full bg-[rgba(18,20,24,0.18)]" />

          <div className="flex items-start justify-between border-b border-[rgba(18,20,24,0.08)] pb-4">
            <div>
              <div className="archive-kicker">Ancestor Profile</div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
                {activeNode.name}
              </h2>
              <div className="text-xs text-[var(--archive-text-soft)]">{activeNode.lifespan}</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveNode(null)}
              aria-label="Close drawer"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(18,20,24,0.08)] text-base font-semibold text-[var(--archive-text)] transition hover:bg-[rgba(18,20,24,0.16)] active:scale-95"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-4 text-sm text-[var(--archive-text)]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-[var(--archive-accent)]">
                Branch: {activeNode.branch}
              </span>
              <ConfidenceBadge label={activeNode.confidence} />
            </div>

            {activeNode.summary && (
              <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/70 p-3.5 leading-6">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  Summary
                </div>
                {activeNode.summary}
              </div>
            )}

            {activeNode.keyEvent && (
              <div className="rounded-2xl border border-[rgba(127,29,45,0.12)] bg-[rgba(127,29,45,0.05)] p-3.5 leading-6">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  Key Historical Event
                </div>
                {activeNode.keyEvent}
              </div>
            )}

            {/* Relationship Links */}
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/70 p-3.5 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                Family Relationships
              </div>
              {activeNode.fatherId && graph.nodeMap[activeNode.fatherId] && (
                <div className="text-xs">
                  <span className="text-[var(--archive-text-soft)]">Father: </span>
                  <button
                    type="button"
                    onClick={() => focusNode(graph.nodeMap[activeNode.fatherId!])}
                    className="font-medium underline hover:text-[var(--archive-accent)]"
                  >
                    {graph.nodeMap[activeNode.fatherId].name}
                  </button>
                </div>
              )}
              {activeNode.motherId && graph.nodeMap[activeNode.motherId] && (
                <div className="text-xs">
                  <span className="text-[var(--archive-text-soft)]">Mother: </span>
                  <button
                    type="button"
                    onClick={() => focusNode(graph.nodeMap[activeNode.motherId!])}
                    className="font-medium underline hover:text-[var(--archive-accent)]"
                  >
                    {graph.nodeMap[activeNode.motherId].name}
                  </button>
                </div>
              )}
              {activeNode.childIds.length > 0 && (
                <div className="text-xs">
                  <span className="text-[var(--archive-text-soft)]">Children: </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {activeNode.childIds.map((cId) => {
                      const child = graph.nodeMap[cId];
                      if (!child) return null;
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={() => focusNode(child)}
                          className="rounded-full border border-[rgba(18,20,24,0.12)] bg-white px-2.5 py-1 text-[11px] font-medium hover:border-[var(--archive-accent)] active:scale-95"
                        >
                          {child.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Attached Document Scan */}
            {activeDocument?.previewUrl ? (
              <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/70 p-3.5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  Attached Primary Record
                </div>
                <SourcePreview
                  src={activeDocument.previewUrl}
                  title={activeDocument.filename}
                  className="h-44 w-full rounded-xl"
                />
                <Link
                  href={`/documents/${activeDocument.id}`}
                  className="mt-2 block text-center text-xs font-semibold text-[var(--archive-accent)] hover:underline"
                >
                  View full document record →
                </Link>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsContributeOpen(true)}
                className="rounded-full border border-[rgba(18,20,24,0.15)] bg-white/80 py-2.5 text-center text-xs font-semibold text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[var(--archive-accent)] active:scale-95"
              >
                + Add Memory
              </button>
              <Link
                href={`/ancestors/${activeNode.id}`}
                className="rounded-full border border-[rgba(127,29,45,0.3)] bg-[var(--archive-accent)] py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white shadow transition hover:bg-[var(--archive-accent-soft)] active:scale-95 flex items-center justify-center"
              >
                Full Dossier
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {activeNode && (
        <ContributeModal
          targetPersonId={activeNode.id}
          targetPersonName={activeNode.name}
          isOpen={isContributeOpen}
          onClose={() => setIsContributeOpen(false)}
        />
      )}
    </div>
  );
}
