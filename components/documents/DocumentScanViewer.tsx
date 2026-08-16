"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DocumentRecord, DocumentScanRegion } from "../../lib/types/genealogy";

interface DocumentScanViewerProps {
  document: DocumentRecord;
  initialRegionId?: string;
}

export function DocumentScanViewer({ document, initialRegionId }: DocumentScanViewerProps) {
  const regions = document.regions || [];
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(
    initialRegionId || (regions.length > 0 ? regions[0].id : null)
  );
  const [showBoxes, setShowBoxes] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  const selectedRegion = regions.find((r) => r.id === selectedRegionId) || null;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[rgba(18,20,24,0.1)] bg-[#f4efe7] p-5 shadow-lg overflow-hidden">
      {/* Top Header & Scan Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--archive-accent)]">
            Primary Document Scan & Evidence Transclusion
          </div>
          <h3 className="text-base font-bold text-[var(--archive-text)] archive-display">
            {document.filename}
          </h3>
        </div>

        {/* Scan Viewer Controls */}
        <div className="flex items-center gap-2">
          {regions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBoxes((prev) => !prev)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition border shadow-xs ${
                showBoxes
                  ? "bg-amber-100 text-amber-950 border-amber-300"
                  : "bg-white/80 text-black/70 border-black/10 hover:bg-white"
              }`}
            >
              {showBoxes ? "👁️ Regions Visible" : "👁️ Hide Regions"}
            </button>
          )}

          <div className="flex items-center rounded-full border border-black/10 bg-white/80 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(prev - 0.2, 0.6))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black/70 hover:bg-black/5"
            >
              −
            </button>
            <span className="px-2 text-[11px] font-semibold text-black/80 font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.2, 2.0))}
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-black/70 hover:bg-black/5"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Main Scan Display Area */}
      <div className="relative flex min-h-[380px] max-h-[600px] w-full items-center justify-center overflow-auto rounded-2xl border border-black/10 bg-[#12161f] p-4">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
          className="relative inline-block transition-transform duration-100 shadow-2xl"
        >
          {document.previewUrl ? (
            <img
              src={document.previewUrl}
              alt={document.filename}
              className="max-h-[500px] w-auto rounded-lg object-contain select-none"
            />
          ) : (
            <div className="flex h-80 w-96 flex-col items-center justify-center rounded-lg bg-black/40 text-center text-xs text-white/60 p-6 border border-white/10">
              <span className="text-2xl mb-2">📜</span>
              <span className="font-semibold text-white/80">{document.filename}</span>
              <span className="mt-1 text-[11px]">Direct image scan preview not available for PDF.</span>
            </div>
          )}

          {/* Interactive Bounding Box Overlays */}
          {showBoxes &&
            regions.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const { x, y, width, height } = region.bbox;
              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegionId(region.id)}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${width}%`,
                    height: `${height}%`
                  }}
                  className={`absolute cursor-pointer rounded-sm border-2 transition-all ${
                    isSelected
                      ? "border-amber-400 bg-amber-400/25 ring-4 ring-amber-400/40 shadow-lg"
                      : "border-emerald-400/80 bg-emerald-400/15 hover:border-amber-300 hover:bg-amber-300/20"
                  }`}
                >
                  <span
                    className={`absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow ${
                      isSelected ? "bg-amber-400" : "bg-emerald-400"
                    }`}
                  >
                    {region.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Selected Micro-Region Detail Card */}
      {selectedRegion && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/90 p-4 shadow-sm space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Targeted Document Region • {selectedRegion.label}
            </span>
            {selectedRegion.page && (
              <span className="text-[10px] font-semibold text-amber-800">
                Page {selectedRegion.page}
              </span>
            )}
          </div>
          <div className="text-xs text-amber-950">
            <span className="font-bold text-amber-900">Proves Fact: </span>
            {selectedRegion.provesFact}
          </div>
          {selectedRegion.transcription && (
            <div className="rounded-xl bg-white/90 p-2.5 text-xs text-amber-950 font-serif italic border border-amber-200/60">
              <span className="not-italic font-mono font-bold text-[10px] uppercase text-amber-800 block mb-0.5">
                Exact Transcription:
              </span>
              &ldquo;{selectedRegion.transcription}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
