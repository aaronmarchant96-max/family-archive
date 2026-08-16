"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  buildFamilyTreeGraph,
  getConnectedLineage,
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

  // Viewport transformation state & ref for 60fps gesture performance
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stateRef = useRef({ zoom: 0.75, panX: 0, panY: 0, isDragging: false });
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep stateRef synced with React state
  useEffect(() => {
    stateRef.current.zoom = zoom;
    stateRef.current.panX = pan.x;
    stateRef.current.panY = pan.y;
    stateRef.current.isDragging = isDragging;
  }, [zoom, pan, isDragging]);

  // Direct GPU transform updater
  const updateTransform = useCallback((newPanX: number, newPanY: number, newZoom: number) => {
    stateRef.current.panX = newPanX;
    stateRef.current.panY = newPanY;
    stateRef.current.zoom = newZoom;
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${newZoom})`;
    }
    setPan({ x: newPanX, y: newPanY });
    setZoom(newZoom);
  }, []);

  // Filter & interaction state
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedConfidence, setSelectedConfidence] = useState<string>("");
  const [filterPatriotsOnly, setFilterPatriotsOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSelectedIndex, setSearchSelectedIndex] = useState<number>(0);
  const [activeNode, setActiveNode] = useState<PersonGraphNode | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [showMinimapMobile, setShowMinimapMobile] = useState(false);
  const [activeEpochId, setActiveEpochId] = useState<string>("colonial");
  const [isContributeOpen, setIsContributeOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Multi-generational connected lineage focus set
  const focusedLineageSet = useMemo<Set<string> | null>(() => {
    if (!isFocusMode) return null;
    const targetId = activeNode?.id || highlightedNodeId;
    if (!targetId) return null;
    return getConnectedLineage(targetId, graph.nodeMap);
  }, [isFocusMode, activeNode?.id, highlightedNodeId, graph.nodeMap]);

  // Search filtering with keyboard navigation support
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return graph.nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.branch.toLowerCase().includes(q) ||
        n.lifespan.includes(q) ||
        (n.location && n.location.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [searchQuery, graph.nodes]);

  // Center on specific node with smooth spring glide and update URL
  const focusNode = useCallback((node: PersonGraphNode) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const isMobile = clientWidth < 640;
    const targetZoom = isMobile ? 0.95 : 1.05;
    const targetX = clientWidth / 2 - (node.x + 120) * targetZoom;
    const targetY = (isMobile ? clientHeight * 0.32 : clientHeight / 2) - (node.y + 50) * targetZoom;
    updateTransform(targetX, targetY, targetZoom);
    setHighlightedNodeId(node.id);
    setActiveNode(node);
    setSearchQuery("");

    // Update URL hash/query without page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("ancestor", node.id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [updateTransform]);

  // Deep linking: focus ancestor from URL on initial load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initialAncestorId = params.get("ancestor");
    if (initialAncestorId && graph.nodeMap[initialAncestorId]) {
      setTimeout(() => {
        focusNode(graph.nodeMap[initialAncestorId]);
      }, 150);
    }
  }, [graph.nodeMap, focusNode]);

  // SVG Export handler
  const handleExportSvg = useCallback(() => {
    const svgEl = document.querySelector(".tree-relationship-svg") as SVGElement;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `family-lineage-tree-${new Date().toISOString().slice(0, 10)}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Jump to specific historical epoch
  const jumpToEpoch = useCallback((epoch: EpochStrata) => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const isMobile = clientWidth < 640;
    const targetZoom = isMobile ? 0.65 : 0.8;
    const targetX = (clientWidth - graph.bounds.width * targetZoom) / 2;
    const targetY = clientHeight * 0.2 - epoch.yStart * targetZoom;
    updateTransform(targetX, targetY, targetZoom);
    setActiveEpochId(epoch.id);
  }, [graph.bounds.width, updateTransform]);

  // Reset / Initial View: Centered nicely on the earliest generation
  const resetView = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth } = containerRef.current;
    const isMobile = clientWidth < 640;
    const initialZoom = isMobile ? 0.6 : 0.75;
    const initialX = (clientWidth - graph.bounds.width * initialZoom) / 2;
    const initialY = isMobile ? 30 : 50;
    updateTransform(initialX, initialY, initialZoom);
    setSelectedBranch("");
    setSelectedConfidence("");
    setFilterPatriotsOnly(false);
    setHighlightedNodeId(null);
    setActiveEpochId("colonial");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("ancestor");
      window.history.replaceState({}, "", url.toString());
    }
  }, [graph.bounds.width, updateTransform]);

  useEffect(() => {
    resetView();
  }, [resetView]);

  // Copy deep share link to clipboard
  const handleCopyShareLink = useCallback(() => {
    if (!activeNode || typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}?ancestor=${activeNode.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [activeNode]);

  // Global Keyboard Shortcuts (⌘K search, Escape close, Arrow navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in text fields
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement;

      // ⌘K or '/' to focus search
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isInput)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Escape closes search or inspector drawer
      if (e.key === "Escape") {
        if (searchQuery) {
          setSearchQuery("");
          searchInputRef.current?.blur();
        } else if (activeNode) {
          setActiveNode(null);
          setHighlightedNodeId(null);
        }
        return;
      }

      if (isInput) return;

      // Canvas Zoom shortcuts
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        updateTransform(stateRef.current.panX, stateRef.current.panY, Math.min(stateRef.current.zoom + 0.15, 2.4));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        updateTransform(stateRef.current.panX, stateRef.current.panY, Math.max(stateRef.current.zoom - 0.15, 0.3));
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      }

      // Active Node Arrow Navigation (Step to Father, Mother, Children, Siblings)
      if (activeNode) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const father = activeNode.fatherId ? graph.nodeMap[activeNode.fatherId] : null;
          const mother = activeNode.motherId ? graph.nodeMap[activeNode.motherId] : null;
          if (father) focusNode(father);
          else if (mother) focusNode(mother);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          const firstChild = activeNode.childIds.length > 0 ? graph.nodeMap[activeNode.childIds[0]] : null;
          if (firstChild) focusNode(firstChild);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNode, searchQuery, graph.nodeMap, focusNode, updateTransform, resetView]);

  // Compute siblings for active node
  const activeSiblings = useMemo(() => {
    if (!activeNode) return [];
    const fatherId = activeNode.fatherId;
    const motherId = activeNode.motherId;
    if (!fatherId && !motherId) return [];

    return graph.nodes.filter(
      (n) =>
        n.id !== activeNode.id &&
        ((fatherId && n.fatherId === fatherId) || (motherId && n.motherId === motherId))
    );
  }, [activeNode, graph.nodes]);

  // Compute Ancestor Breadcrumb Path
  const ancestorPath = useMemo(() => {
    if (!activeNode) return [];
    const path: PersonGraphNode[] = [];
    let curr: PersonGraphNode | undefined = activeNode;
    while (curr) {
      path.unshift(curr);
      curr = curr.fatherId ? graph.nodeMap[curr.fatherId] : curr.motherId ? graph.nodeMap[curr.motherId] : undefined;
    }
    return path;
  }, [activeNode, graph.nodeMap]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".tree-interactive-node") || (e.target as HTMLElement).closest(".tree-ui-control")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: stateRef.current.panX,
      panY: stateRef.current.panY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!stateRef.current.isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextPanX = dragStartRef.current.panX + dx;
    const nextPanY = dragStartRef.current.panY + dy;
    updateTransform(nextPanX, nextPanY, stateRef.current.zoom);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach non-passive native wheel & touch listeners to guarantee NO page scroll hijacking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Non-passive wheel handler: stops page scroll and zooms directly toward cursor
    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const currentZoom = stateRef.current.zoom;
      const currentPanX = stateRef.current.panX;
      const currentPanY = stateRef.current.panY;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const nextZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.3), 2.4);

      // Natural Google Maps / Figma cursor-centered zoom math
      const nextPanX = mouseX - (mouseX - currentPanX) * (nextZoom / currentZoom);
      const nextPanY = mouseY - (mouseY - currentPanY) * (nextZoom / currentZoom);

      updateTransform(nextPanX, nextPanY, nextZoom);
    };

    // Non-passive touch handlers for iOS/Android
    const handleNativeTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest(".tree-interactive-node") || (e.target as HTMLElement).closest(".tree-ui-control")) {
        return;
      }
      if (e.touches.length === 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          panX: stateRef.current.panX,
          panY: stateRef.current.panY
        };
        touchDistanceRef.current = null;
      } else if (e.touches.length === 2) {
        setIsDragging(false);
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistanceRef.current = Math.hypot(dx, dy);
      }
    };

    const handleNativeTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Stop outer page scroll bounce on mobile
      if (e.touches.length === 1 && stateRef.current.isDragging) {
        const dx = e.touches[0].clientX - dragStartRef.current.x;
        const dy = e.touches[0].clientY - dragStartRef.current.y;
        const nextPanX = dragStartRef.current.panX + dx;
        const nextPanY = dragStartRef.current.panY + dy;
        updateTransform(nextPanX, nextPanY, stateRef.current.zoom);
      } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const scaleDelta = currentDist / touchDistanceRef.current;
        touchDistanceRef.current = currentDist;
        const nextZoom = Math.min(Math.max(stateRef.current.zoom * scaleDelta, 0.3), 2.4);
        updateTransform(stateRef.current.panX, stateRef.current.panY, nextZoom);
      }
    };

    const handleNativeTouchEnd = () => {
      setIsDragging(false);
      touchDistanceRef.current = null;
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    container.addEventListener("touchstart", handleNativeTouchStart, { passive: false });
    container.addEventListener("touchmove", handleNativeTouchMove, { passive: false });
    container.addEventListener("touchend", handleNativeTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
      container.removeEventListener("touchstart", handleNativeTouchStart);
      container.removeEventListener("touchmove", handleNativeTouchMove);
      container.removeEventListener("touchend", handleNativeTouchEnd);
    };
  }, [updateTransform]);

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
              Pan, pinch to zoom, and explore 7 generations across historical epochs. Tap any ancestor to inspect verified evidence, ancestors, and descendants.
            </p>
          </div>

          {/* Desktop Zoom & View Controls */}
          <div className="tree-ui-control hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateTransform(pan.x, pan.y, Math.min(zoom + 0.18, 2.4))}
              aria-label="Zoom in"
              title="Zoom In (+)"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 text-base font-semibold text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => updateTransform(pan.x, pan.y, Math.max(zoom - 0.18, 0.3))}
              aria-label="Zoom out"
              title="Zoom Out (-)"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 text-base font-semibold text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              −
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset View (0)"
              className="rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              Reset View
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title="Toggle Fullscreen"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(18,20,24,0.12)] bg-white/80 text-xs font-semibold text-[var(--archive-text)] shadow-sm transition hover:bg-white hover:border-[rgba(127,29,45,0.4)] active:scale-95"
            >
              {isFullscreen ? "🗗" : "⛶"}
            </button>
          </div>
        </div>

        {/* Search Input with Keyboard Shortcut & Autocomplete */}
        <div className="relative">
          <label className="block relative">
            <span className="sr-only">Search family tree</span>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchSelectedIndex(0);
              }}
              onKeyDown={(e) => {
                if (searchResults.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSearchSelectedIndex((prev) => (prev + 1) % searchResults.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSearchSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const target = searchResults[searchSelectedIndex] || searchResults[0];
                  if (target) focusNode(target);
                }
              }}
              placeholder="Search by name, branch, year, or location (Press ⌘K or / to search)..."
              className="w-full rounded-2xl border border-[rgba(18,20,24,0.12)] bg-white/80 pl-4 pr-16 py-3 text-sm text-[var(--archive-text)] outline-none placeholder:text-[var(--archive-text-soft)] shadow-sm focus:border-[rgba(127,29,45,0.5)] focus:ring-2 focus:ring-[rgba(127,29,45,0.12)]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <span className="hidden sm:inline-block rounded-md border border-[rgba(18,20,24,0.15)] bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--archive-text-soft)] shadow-xs">
                ⌘K
              </span>
            </div>
          </label>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-10 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(18,20,24,0.08)] text-xs text-[var(--archive-text-soft)] hover:bg-[rgba(18,20,24,0.16)]"
            >
              ✕
            </button>
          )}

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-[rgba(18,20,24,0.12)] bg-white p-2 shadow-2xl animate-in fade-in-50 duration-100">
              {searchResults.map((node, idx) => (
                <div
                  key={node.id}
                  onClick={() => focusNode(node)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                    idx === searchSelectedIndex
                      ? "bg-[rgba(127,29,45,0.08)] text-[var(--archive-accent)] font-medium"
                      : "text-[var(--archive-text)] hover:bg-[rgba(127,29,45,0.04)]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div>
                      <span className="font-semibold">{node.name}</span>{" "}
                      <span className="text-xs text-[var(--archive-text-soft)]">({node.lifespan})</span>
                    </div>
                    {node.location && (
                      <div className="text-[11px] text-[var(--archive-text-soft)] flex items-center gap-1">
                        <span>📍</span> {node.location}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {node.sarLineStatus && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 rounded-full px-2 py-0.5 font-semibold">
                        ⭐ Patriot
                      </span>
                    )}
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: BRANCH_COLORS[node.branch] || "#6b7280" }}
                    >
                      {node.branch}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Historical Epoch Jump Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold text-[var(--archive-text)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--archive-text-soft)] mr-1 shrink-0">
            Era:
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

        {/* Multi-Filter Bar: Branches, Confidence, & Patriot Verification */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[rgba(18,20,24,0.06)]">
          {/* Branch Filter Horizontal Scroll Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedBranch("")}
              className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                !selectedBranch
                  ? "border-[rgba(127,29,45,0.4)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)]"
                  : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)] hover:bg-white"
              }`}
            >
              All Branches ({graph.nodes.length})
            </button>
            {graph.branches.slice(0, 8).map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => setSelectedBranch(selectedBranch === b.name ? "" : b.name)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold transition shrink-0 ${
                  selectedBranch === b.name
                    ? "border-[rgba(127,29,45,0.4)] bg-[rgba(127,29,45,0.12)] text-[var(--archive-accent)] shadow-xs"
                    : "border-[rgba(18,20,24,0.08)] bg-white/70 text-[var(--archive-text)] hover:bg-white"
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                <span>{b.name}</span>
                <span className="text-[10px] opacity-70">({b.count})</span>
              </button>
            ))}
          </div>

          {/* Quick Confidence & Patriot Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() =>
                setSelectedConfidence((prev) => (prev === "Primary Source" ? "" : "Primary Source"))
              }
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition shrink-0 ${
                selectedConfidence === "Primary Source"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                  : "border-black/5 bg-white/60 text-black/70 hover:bg-white"
              }`}
            >
              🟢 Primary Sources Only
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedConfidence((prev) => (prev === "Needs Review" ? "" : "Needs Review"))
              }
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition shrink-0 ${
                selectedConfidence === "Needs Review"
                  ? "border-amber-600 bg-amber-50 text-amber-900 shadow-xs"
                  : "border-black/5 bg-white/60 text-black/70 hover:bg-white"
              }`}
            >
              🟠 Needs Review
            </button>
            <button
              type="button"
              onClick={() => setFilterPatriotsOnly((prev) => !prev)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition shrink-0 ${
                filterPatriotsOnly
                  ? "border-amber-500 bg-amber-100 text-amber-950 font-bold shadow-xs"
                  : "border-black/5 bg-white/60 text-black/70 hover:bg-white"
              }`}
            >
              ⭐ Patriots / SAR
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          touchAction: "none",
          overscrollBehavior: "contain"
        }}
        className={`relative overflow-hidden border border-[rgba(18,20,24,0.12)] bg-[#12151a] shadow-inner select-none transition-all duration-200 ${
          isFullscreen
            ? "fixed inset-0 z-50 rounded-none h-screen w-screen"
            : "h-[70vh] min-h-[540px] sm:h-[760px] w-full rounded-[2rem]"
        } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: "0 0",
            width: graph.bounds.width,
            height: graph.bounds.height,
            willChange: isDragging ? "transform" : "auto",
            backfaceVisibility: "hidden"
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
            className="tree-relationship-svg"
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

              const isEdgeInFocus =
                !focusedLineageSet ||
                (focusedLineageSet.has(edge.sourceId) && focusedLineageSet.has(edge.targetId));

              const isBranchMatch =
                !selectedBranch ||
                source.branch === selectedBranch ||
                target.branch === selectedBranch;

              const isConfidenceMatch =
                !selectedConfidence ||
                (source.confidence === selectedConfidence || target.confidence === selectedConfidence);

              const isPatriotMatch =
                !filterPatriotsOnly ||
                Boolean(source.sarLineStatus || target.sarLineStatus);

              const isHighlighted = isEdgeInFocus && isBranchMatch && isConfidenceMatch && isPatriotMatch;

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
                      ? focusedLineageSet
                        ? "#f59e0b"
                        : BRANCH_COLORS[source.branch] || "rgba(225, 216, 203, 0.4)"
                      : "rgba(255, 255, 255, 0.05)"
                  }
                  strokeWidth={isHighlighted ? (focusedLineageSet ? 3.5 : 2.5) : 1}
                  strokeDasharray={edge.type === "spouse" ? "4,4" : undefined}
                  opacity={isHighlighted ? 0.85 : 0.06}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* 3. Ancestor Nodes */}
          {graph.nodes.map((node) => {
            const isBranchMatch = !selectedBranch || node.branch === selectedBranch;
            const isConfidenceMatch = !selectedConfidence || node.confidence === selectedConfidence;
            const isPatriotMatch = !filterPatriotsOnly || Boolean(node.sarLineStatus);
            const isNodeInFocus = !focusedLineageSet || focusedLineageSet.has(node.id);
            const isSelected = activeNode?.id === node.id;
            const isHighlighted = highlightedNodeId === node.id;

            const finalOpacity =
              isNodeInFocus && isBranchMatch && isConfidenceMatch && isPatriotMatch ? 1 : 0.14;

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
                  opacity: finalOpacity
                }}
                className={`tree-interactive-node group flex cursor-pointer flex-col justify-between rounded-2xl border p-3 shadow-lg transition duration-150 hover:-translate-y-1 hover:shadow-2xl active:scale-95 ${
                  isSelected
                    ? "border-[var(--archive-accent)] bg-[#f4efe7] text-[var(--archive-text)] ring-4 ring-[rgba(127,29,45,0.3)]"
                    : isHighlighted
                    ? "border-amber-400 bg-[#f4efe7] text-[var(--archive-text)] ring-2 ring-amber-400"
                    : "border-[rgba(255,255,255,0.12)] bg-[#181d24] text-[#e1d8cb] hover:border-[rgba(225,216,203,0.4)]"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white"
                      style={{ backgroundColor: BRANCH_COLORS[node.branch] || "#6b7280" }}
                    >
                      {node.branch}
                    </span>
                    {node.sarLineStatus && (
                      <span className="text-[10px] text-amber-300 font-bold" title="Revolutionary War Patriot">
                        ⭐
                      </span>
                    )}
                  </div>
                  <ConfidenceBadge label={node.confidence} />
                </div>

                <div className="truncate font-semibold tracking-tight leading-tight text-sm">
                  {node.name}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] opacity-75">
                    <span>{node.lifespan}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--archive-accent-soft)]">
                      Gen {node.generation + 1}
                    </span>
                  </div>
                  {node.location && (
                    <div className="truncate text-[10px] text-[#e1d8cb]/60 flex items-center gap-1">
                      <span className="text-amber-400 text-[10px]">📍</span>
                      <span className="truncate">{node.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Canvas Controls */}
        <div className="tree-ui-control absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0c1015]/85 p-1.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => updateTransform(pan.x, pan.y, Math.min(zoom + 0.18, 2.4))}
            aria-label="Zoom in"
            title="Zoom in (+)"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[#f4efe7] hover:bg-white/20 active:scale-95"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => updateTransform(pan.x, pan.y, Math.max(zoom - 0.18, 0.3))}
            aria-label="Zoom out"
            title="Zoom out (-)"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[#f4efe7] hover:bg-white/20 active:scale-95"
          >
            −
          </button>
          <button
            type="button"
            onClick={resetView}
            aria-label="Reset viewport"
            title="Reset View (0)"
            className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#e1d8cb] hover:text-white"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleExportSvg}
            title="Download SVG layout of lineage tree"
            className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 border-l border-white/10"
          >
            Export SVG
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title="Toggle Fullscreen Canvas"
            className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 border-l border-white/10"
          >
            {isFullscreen ? "Exit Full" : "Full"}
          </button>
          <button
            type="button"
            onClick={() => setShowMinimapMobile((prev) => !prev)}
            className="sm:hidden px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-300 hover:text-amber-200 border-l border-white/10"
          >
            {showMinimapMobile ? "Hide Radar" : "Radar"}
          </button>
        </div>

        {/* Interactive Minimap Radar Overlay with Viewport Frustum Box */}
        <div
          className={`absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1.5 transition ${
            showMinimapMobile ? "block" : "hidden sm:flex"
          }`}
        >
          <div className="rounded-xl border border-white/10 bg-[#0c1015]/90 p-2 shadow-2xl backdrop-blur-md">
            <div className="mb-1 flex items-center justify-between text-[9px] font-semibold uppercase tracking-widest text-[#e1d8cb]/60">
              <span>Radar Minimap</span>
              <span className="text-[8px] text-amber-400/80">Click to jump</span>
            </div>
            <div
              style={{ width: 140, height: 80 }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;
                if (!containerRef.current) return;
                const { clientWidth, clientHeight } = containerRef.current;
                const targetWorldX = (clickX / 140) * graph.bounds.width;
                const targetWorldY = (clickY / 80) * graph.bounds.height;
                const newPanX = clientWidth / 2 - targetWorldX * zoom;
                const newPanY = clientHeight / 2 - targetWorldY * zoom;
                updateTransform(newPanX, newPanY, zoom);
              }}
              className="relative overflow-hidden rounded-lg bg-[#141a22] cursor-crosshair"
            >
              {/* Nodes preview */}
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

              {/* Viewport Frustum Box */}
              {containerRef.current && (
                <div
                  style={{
                    position: "absolute",
                    left: Math.max(0, (-pan.x / (graph.bounds.width * zoom)) * 140),
                    top: Math.max(0, (-pan.y / (graph.bounds.height * zoom)) * 80),
                    width: Math.min(140, (containerRef.current.clientWidth / (graph.bounds.width * zoom)) * 140),
                    height: Math.min(80, (containerRef.current.clientHeight / (graph.bounds.height * zoom)) * 80),
                    border: "1.5px solid rgba(245, 158, 11, 0.8)",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    pointerEvents: "none"
                  }}
                  className="rounded-xs transition-all duration-75"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Inspector Drawer */}
      {activeNode && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] w-full flex-col rounded-t-[2rem] border-t border-[rgba(18,20,24,0.15)] bg-[#f4efe7] p-5 sm:p-6 shadow-2xl overflow-y-auto sm:inset-y-0 sm:right-0 sm:left-auto sm:max-w-md sm:rounded-none sm:border-l sm:border-t-0 animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          <div className="sm:hidden mx-auto mb-3 h-1.5 w-12 rounded-full bg-[rgba(18,20,24,0.18)]" />

          {/* Drawer Header */}
          <div className="flex items-start justify-between border-b border-[rgba(18,20,24,0.08)] pb-4">
            <div>
              <div className="archive-kicker">Ancestor Profile</div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--archive-text)] archive-display">
                {activeNode.name}
              </h2>
              <div className="text-xs text-[var(--archive-text-soft)]">{activeNode.lifespan}</div>
              {activeNode.location && (
                <div className="text-xs text-[var(--archive-accent)] flex items-center gap-1 mt-1 font-medium">
                  <span>📍</span> {activeNode.location}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                title="Toggle lineage focus mode (highlights direct ancestors and descendants)"
                className={`text-[10px] px-2.5 py-1.5 rounded-full border transition font-medium ${
                  isFocusMode
                    ? "bg-amber-100/90 border-amber-300 text-amber-900 shadow-sm"
                    : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10"
                }`}
              >
                {isFocusMode ? "⚡ Focus: ON" : "Focus: OFF"}
              </button>
              <button
                type="button"
                onClick={() => setActiveNode(null)}
                aria-label="Close drawer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(18,20,24,0.08)] text-base font-semibold text-[var(--archive-text)] transition hover:bg-[rgba(18,20,24,0.16)] active:scale-95"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4 text-sm text-[var(--archive-text)]">
            {/* Ancestor Breadcrumb Trail */}
            {ancestorPath.length > 1 && (
              <div className="rounded-xl border border-[rgba(18,20,24,0.08)] bg-white/60 p-2.5">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  Lineage Trail
                </div>
                <div className="flex flex-wrap items-center gap-1 text-xs">
                  {ancestorPath.map((item, i) => (
                    <span key={item.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => focusNode(item)}
                        className={`hover:underline ${
                          item.id === activeNode.id
                            ? "font-bold text-[var(--archive-accent)]"
                            : "text-[var(--archive-text-soft)]"
                        }`}
                      >
                        {item.name}
                      </button>
                      {i < ancestorPath.length - 1 && (
                        <span className="text-[10px] text-black/30">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-[var(--archive-accent)]">
                Branch: {activeNode.branch}
              </span>
              <ConfidenceBadge label={activeNode.confidence} />
            </div>

            {/* Military / Revolutionary War Patriot Badge */}
            {activeNode.sarLineStatus && (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-50/80 p-3.5 leading-5 text-amber-950 shadow-sm">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <span className="text-sm">⭐</span> Revolutionary War Patriot
                </div>
                <div className="text-xs font-semibold text-amber-950">
                  {activeNode.sarLineStatus.patriotAncestor || activeNode.name} — {activeNode.sarLineStatus.service}
                </div>
                <div className="text-[11px] text-amber-900/80 mt-1">
                  Verified Record: <span className="font-medium">{activeNode.sarLineStatus.keyRecord}</span> ({activeNode.sarLineStatus.status})
                </div>
              </div>
            )}

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

            {/* Source Citation & Evidence */}
            {activeNode.sourceCitation && (
              <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/70 p-3.5 leading-6">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                  Source Citation & Evidence
                </div>
                <div className="text-xs text-[var(--archive-text-soft)] italic">{activeNode.sourceCitation}</div>
              </div>
            )}

            {/* Comprehensive Family Relationships: Parents, Siblings, Children */}
            <div className="rounded-2xl border border-[rgba(18,20,24,0.08)] bg-white/70 p-3.5 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--archive-accent)]">
                Family Relationships
              </div>

              {/* Parents */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--archive-text-soft)] block text-[10px] uppercase">Father</span>
                  {activeNode.fatherId && graph.nodeMap[activeNode.fatherId] ? (
                    <button
                      type="button"
                      onClick={() => focusNode(graph.nodeMap[activeNode.fatherId!])}
                      className="font-medium underline hover:text-[var(--archive-accent)] text-left"
                    >
                      {graph.nodeMap[activeNode.fatherId].name}
                    </button>
                  ) : (
                    <span className="text-[var(--archive-text-soft)] italic">Unknown</span>
                  )}
                </div>
                <div>
                  <span className="text-[var(--archive-text-soft)] block text-[10px] uppercase">Mother</span>
                  {activeNode.motherId && graph.nodeMap[activeNode.motherId] ? (
                    <button
                      type="button"
                      onClick={() => focusNode(graph.nodeMap[activeNode.motherId!])}
                      className="font-medium underline hover:text-[var(--archive-accent)] text-left"
                    >
                      {graph.nodeMap[activeNode.motherId].name}
                    </button>
                  ) : (
                    <span className="text-[var(--archive-text-soft)] italic">Unknown</span>
                  )}
                </div>
              </div>

              {/* Siblings */}
              {activeSiblings.length > 0 && (
                <div className="text-xs pt-1 border-t border-black/5">
                  <span className="text-[var(--archive-text-soft)] text-[10px] uppercase block mb-1">
                    Siblings ({activeSiblings.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeSiblings.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => focusNode(s)}
                        className="rounded-full border border-[rgba(18,20,24,0.12)] bg-white px-2 py-0.5 text-[11px] font-medium hover:border-[var(--archive-accent)] active:scale-95"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Children */}
              {activeNode.childIds.length > 0 && (
                <div className="text-xs pt-1 border-t border-black/5">
                  <span className="text-[var(--archive-text-soft)] text-[10px] uppercase block mb-1">
                    Children ({activeNode.childIds.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeNode.childIds.map((cId) => {
                      const child = graph.nodeMap[cId];
                      if (!child) return null;
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={() => focusNode(child)}
                          className="rounded-full border border-[rgba(18,20,24,0.12)] bg-white px-2 py-0.5 text-[11px] font-medium hover:border-[var(--archive-accent)] active:scale-95"
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

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="rounded-full border border-[rgba(18,20,24,0.15)] bg-white/80 py-2.5 text-center text-xs font-semibold text-[var(--archive-text)] shadow-xs transition hover:bg-white hover:border-[var(--archive-accent)] active:scale-95"
              >
                {copyFeedback ? "✓ Copied!" : "🔗 Share"}
              </button>
              <button
                type="button"
                onClick={() => setIsContributeOpen(true)}
                className="rounded-full border border-[rgba(18,20,24,0.15)] bg-white/80 py-2.5 text-center text-xs font-semibold text-[var(--archive-text)] shadow-xs transition hover:bg-white hover:border-[var(--archive-accent)] active:scale-95"
              >
                + Memory
              </button>
              <Link
                href={`/ancestors/${activeNode.id}`}
                className="rounded-full border border-[rgba(127,29,45,0.3)] bg-[var(--archive-accent)] py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition hover:bg-[var(--archive-accent-soft)] active:scale-95 flex items-center justify-center"
              >
                Dossier
              </Link>
            </div>

            {/* Keyboard navigation helper */}
            <div className="text-[10px] text-center text-[var(--archive-text-soft)] pt-2 border-t border-black/5">
              Keyboard: <span className="font-mono">↑</span> Parent · <span className="font-mono">↓</span> Child · <span className="font-mono">Esc</span> Close
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
