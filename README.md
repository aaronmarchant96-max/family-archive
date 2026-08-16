# Marchant Family Archive & Engelbartian Knowledge Workbench

A private living archive for family records, source-linked review, evidence-tiered genealogy, and interactive historical exploration across 7+ generations.

**Live Archive:** [https://family-archive-rose.vercel.app](https://family-archive-rose.vercel.app)

---

## Architecture & Product Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Marchant Family Archive Platform                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Core Visualizer & Engine    │ 60fps Lineage Constellation, Radar Minimap │
│ 2. Engelbartian Workbench      │ Dual-Pane Ancestor Comparator & Diff Tool  │
│ 3. Spatio-Temporal Projection  │ Interactive 1715–Present Migration Map     │
│ 4. Deep Evidence & Transclusion│ Micro-Addressable Scan Bounding Boxes      │
│ 5. MRCM Contribution System    │ Conflict Resolution & Living Memory Queue  │
│ 6. Rigorous Test Matrix        │ 9 Test Suites, 57 Tests, Snapshot Verified │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## Key Modules & Features

### 1. Interactive Lineage Tree & Graph Visualizer (`/tree`)
- **60fps Gesture Canvas:** Hardware-accelerated pan and smooth zoom with multi-generational epoch strata background bands.
- **Radar Minimap:** Live viewport frustum box tracking position across the full 36-node family graph with click-to-jump.
- **Filter & Search Bar:** Real-time filtering by branch colors (Ramsey, Dyer, Edwards, Moore, Marchant, Bowen, etc.), confidence tiers, and Revolutionary War SAR patriots.
- **Keyboard Navigation:** Full keyboard navigation (<kbd>↑</kbd> Parent, <kbd>↓</kbd> Child, <kbd>Esc</kbd> Close, <kbd>+</kbd>/<kbd>−</kbd> Zoom).

### 2. Dual-Pane Ancestor Comparator (`components/tree/DualAncestorComparator.tsx`)
- **Side-by-Side Synthesis:** Compare any two ancestor dossiers (e.g. evaluating candidate duplicates or disputed generations).
- **Automated Conflict Detection:** Identifies generational gaps, birth year disparities ($>15$ years), parent ID mismatches, and confidence differentials.

### 3. Spatio-Temporal Migration Map (`components/tree/MigrationMapView.tsx`)
- **Geographic Projection:** Visualizes ancestral movement from colonial roots to the Pacific Northwest and modern Alberta.
- **Historical Trail Presets:**
  - *Ramsey Frontier Line:* Delaware (1728) $\rightarrow$ North Carolina (1782) $\rightarrow$ Claiborne Co., TN (1828) $\rightarrow$ Davis Co., IA (1850)
  - *Dyer Oregon Trail:* Kentucky (1802) $\rightarrow$ Indiana (1822) $\rightarrow$ Polk Co., OR (1865) $\rightarrow$ Whitman Co., WA (1880)
  - *Moore / Marchant Transatlantic Line:* Ballymena, County Antrim (1846) $\rightarrow$ Whitman Co., WA $\rightarrow$ Calgary, AB (1958)
  - *Bowen New England to Ontario Line:* Swansea, MA (1715) $\rightarrow$ Mooretown, Ontario (1848)
- **Provenance-Tiered Settlement Data:** All 13 pins in `data/places.json` carry coordinates, canonical branch tags, confidence ratings, and primary source citations.

### 4. Micro-Addressable Document Scans (`/documents/[id]`)
- **Interactive Scan Viewer:** Deep-linkable bounding box overlays on primary source records (e.g. 1782 Revolutionary War Pay Voucher, 1850 Federal Census).
- **Transcription Popovers:** Immediate transcription snippet display tied directly to proved facts.

### 5. Collaborative Contribution & Review Pipeline (`/contribute`, `lib/mrcm.ts`)
- **Living Memory Contributions:** Family members can submit photos, anecdotes, and record corrections.
- **Multi-Role Conflict Management (MRCM):** Automated conflict detection and structured review queue.

---

## Data Schema & Types (`lib/types/genealogy.ts`)

- `PersonRecord`: 133+ ancestor profiles with structured birth-year dispute arrays (`birth_year_sources`), aliases, SAR service status, and bidirectional parent/child relationships.
- `PlaceRecord`: Historical settlement pins with coordinates, historical context, and primary citations.
- `DocumentRecord`: 86+ historical scans and PDF transcripts with normalized bounding box regions (`DocumentScanRegion`).

---

## Verification & Test Matrix

The repository enforces strict verification across **9 automated test suites** (57 tests):

```bash
npm test
```

| Test Suite | Purpose |
| :--- | :--- |
| `archive-integrity.test.ts` | Zero dangling references, bidirectional parent-child & spousal symmetry |
| `family-tree-graph.test.ts` | Pinned exact 36-node snapshot equality & cycle-safe graph layout |
| `migration-engine.test.ts` | Coordinate bounds, canonical branch taxonomy, and citation verification |
| `dual-ancestor-comparator.test.ts` | Conflict detection, diff calculation, and candidate match heuristics |
| `document-scan-regions.test.ts` | Normalized (0–100%) bounding-box coordinate validation & unique region IDs |
| `mrcm.test.ts` | Multi-role conflict management and contribution state machines |
| `contribution-store.test.ts` | Contribution storage, deduplication, and review workflows |
| `genealogy-v2-schema.test.ts` | V2 schema validation and backward compatibility |
| `children-of-frontier.test.ts` | Historical event timeline parsing and educational module tests |

---

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run full test suite
npm test

# Build production bundle
npm run build
```
