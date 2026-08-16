"use client";

import React, { useState } from "react";
import placesData from "../../data/places.json";
import { PlaceRecord } from "../../lib/types/genealogy";
import { PersonGraphNode } from "../../lib/familyTreeEngine";

interface MigrationMapViewProps {
  allNodes: PersonGraphNode[];
  onSelectNode: (node: PersonGraphNode) => void;
}

const places = placesData as PlaceRecord[];

const TRAILS = [
  {
    id: "all",
    name: "All Historical Settlements",
    color: "#d97706",
    placeIds: places.map((p) => p.id)
  },
  {
    id: "ramsey",
    name: "Ramsey Frontier Line (DE → NC → TN → IA)",
    color: "#f59e0b",
    placeIds: ["place-delaware-colony", "place-nc-guilford", "place-claiborne-tn", "place-davis-ia", "place-decatur-ia"]
  },
  {
    id: "dyer",
    name: "Dyer Oregon Trail (KY → IN → OR → WA)",
    color: "#06b6d4",
    placeIds: ["place-washington-ky", "place-floyd-in", "place-polk-or", "place-whitman-wa"]
  },
  {
    id: "moore-marchant",
    name: "Moore / Marchant Transatlantic & Modern Line",
    color: "#10b981",
    placeIds: ["place-ballymena-antrim", "place-whitman-wa", "place-calgary-ab"]
  },
  {
    id: "bowen",
    name: "Bowen New England to Ontario Line",
    color: "#8b5cf6",
    placeIds: ["place-bristol-ma", "place-lambton-on"]
  }
];

export function MigrationMapView({ allNodes, onSelectNode }: MigrationMapViewProps) {
  const [selectedTrailId, setSelectedTrailId] = useState<string>("all");
  const [activePlace, setActivePlace] = useState<PlaceRecord | null>(null);

  const activeTrail = TRAILS.find((t) => t.id === selectedTrailId) || TRAILS[0];
  const visiblePlaces = places.filter((p) => activeTrail.placeIds.includes(p.id));

  // Geographic SVG map projection math
  // Longitude range: -130 (Pacific/WA/OR) to 0 (Ireland / Atlantic)
  // Latitude range: 30 (Southern US) to 60 (Northern Ireland / Alberta)
  const minLng = -130;
  const maxLng = 5;
  const minLat = 30;
  const maxLat = 58;
  const mapWidth = 900;
  const mapHeight = 520;

  const project = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * mapWidth;
    const y = ((maxLat - lat) / (maxLat - minLat)) * mapHeight;
    return { x, y };
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0c1015] text-[#f4efe7]">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#12161f]/90 p-4 backdrop-blur-md z-10">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Spatio-Temporal Geographic Projection
          </div>
          <h2 className="text-lg font-bold text-white archive-display">
            Family Migration Pathways (1715–Present)
          </h2>
        </div>

        {/* Trail Selector Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {TRAILS.map((trail) => {
            const isSelected = trail.id === selectedTrailId;
            return (
              <button
                key={trail.id}
                type="button"
                onClick={() => setSelectedTrailId(trail.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                  isSelected
                    ? "bg-amber-400 text-black border-amber-300 shadow-md scale-105"
                    : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: trail.color }} />
                {trail.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center p-4">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="h-full w-full max-h-[75vh] select-none"
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

          {/* Regional Reference Landmass Label Accents */}
          <text x="180" y="240" fill="rgba(255,255,255,0.12)" fontSize="18" fontWeight="bold" letterSpacing="4">
            WESTERN FRONTIER & PACIFIC NW
          </text>
          <text x="440" y="320" fill="rgba(255,255,255,0.12)" fontSize="18" fontWeight="bold" letterSpacing="4">
            MIDWEST & APPALACHIA
          </text>
          <text x="760" y="160" fill="rgba(255,255,255,0.12)" fontSize="18" fontWeight="bold" letterSpacing="4">
            IRELAND / ATLANTIC
          </text>

          {/* Migration Path Lines */}
          {visiblePlaces.length > 1 && (
            <polyline
              points={visiblePlaces
                .map((p) => {
                  const pt = project(p.lat, p.lng);
                  return `${pt.x},${pt.y}`;
                })
                .join(" ")}
              fill="none"
              stroke={activeTrail.color}
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeOpacity="0.75"
            />
          )}

          {/* Settlement Pins */}
          {visiblePlaces.map((place) => {
            const pt = project(place.lat, place.lng);
            const isSelected = activePlace?.id === place.id;
            return (
              <g
                key={place.id}
                onClick={() => setActivePlace(place)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Ping animation ring */}
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="16"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}
                {/* Pin Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? "9" : "6"}
                  fill={isSelected ? "#fbbf24" : activeTrail.color}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? "2" : "1.5"}
                  className="shadow-lg"
                />
                {/* Pin Label */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  fill={isSelected ? "#fef08a" : "#f4efe7"}
                  fontSize={isSelected ? "11" : "9.5"}
                  fontWeight="bold"
                  className="drop-shadow-md"
                >
                  {place.name.split(",")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Place Details Overlay Modal */}
        {activePlace && (
          <div className="absolute bottom-6 right-6 w-96 rounded-2xl border border-white/20 bg-[#12161f]/95 p-4 shadow-2xl backdrop-blur-md text-xs space-y-2.5 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between border-b border-white/10 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {activePlace.era} • {activePlace.confidence}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">{activePlace.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePlace(null)}
                className="rounded-full bg-white/10 p-1 text-white hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            {activePlace.historicalContext && (
              <p className="text-white/90 leading-relaxed">{activePlace.historicalContext}</p>
            )}

            <div className="rounded-xl bg-black/40 p-2.5 text-[11px] text-white/70 italic border border-white/5">
              <span className="font-semibold text-white/90 not-italic block mb-0.5">Primary Source:</span>
              {activePlace.sourceCitation}
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              {activePlace.branches.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/30"
                >
                  {b} Branch
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
