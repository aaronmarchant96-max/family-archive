<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Living Red Book Archive — Project Rules

These rules govern all development, data entry, and research work on the Living Red Book genealogical archive.

## Genealogy Standards

### Evidence Tiering (Strict Vocabulary)

Use EXACTLY one of these four values for all `confidence` fields:

- 🟢 **Primary Source** — Original contemporaneous documents (wills, deeds, censuses, birth/marriage/death records, military records, newspaper announcements).
- 🔵 **Strong Evidence** — Multiple corroborating sources or well-documented family records.
- 🟠 **Needs Review** — Incomplete or partially verified information; requires additional sourcing.
- 🟣 **Corroborated Compilation** — Compiled sources (family histories, ancestry compilations) cross-checked against primary sources.

Tests validate this vocabulary strictly across all `people.json`, `documents.json`, and timeline entries. Any other value causes build failure.

Oral tradition and family stories are logged in `data/familyMemory.json` (separate from primary sources) with "Family Memory" or "Needs Review" tier.

### Family-Only Principle (Strict Conflation Filtering)

**Do not add records unless they are directly related to actual family members.**

Reject unrelated same-name individuals even if primary source documents exist. Example conflations encountered:
- 1778 William Dyer (15th Virginia Regiment, coastal Virginia recruited) ≠ Shenandoah Valley Dyer line → **SKIP**
- 1828 William Dyer (Morgan County, Illinois) ≠ Your family line (200+ miles away) → **SKIP**
- Jabez Hopkins (War of 1812, Steuben County, NY Militia) ≠ Rachel Clouse's husband (southwest VA/TN/IA) → **SKIP**

**Conflation Detection Markers:**
- Different geographic regions across time (especially recruitment patterns) → Separate people
- Timeline impossibilities (documented dead before obtaining land) → Separate people
- No connecting primary sources (wills, deeds, pension applications) → Don't merge
- Different life contexts (coastal soldier vs. frontier settler) → Separate people

### Disambiguation & Same-Name Policy

- Maintain **separate working profiles** for same-name individuals in different locations until linked by direct primary evidence.
- Use disambiguating suffixes: `-1799`, `-before-1805`, `-jr`, `-sr` when necessary.
- Treat any contemporary census entries as separate profiles until explicitly linked by family documents.
- Document conflation analysis in `genealogy_research/search_queries.md` for future reference.

### Data Integrity & Synchronization

- **CSV is source of truth**: `genealogy_research/people.csv` (65 verified people) drives all updates to `data/people.json` (118 records, includes historical entries).
- **Never manually edit JSON files** if the record exists in CSV. Run `sync_data.py` to sync instead.
- Always run `sync_data.py` (at `.agents/skills/genealogy_helper/scripts/sync_data.py`) after CSV changes to keep `data/people.json` and `data/documents.json` aligned.
- CSV columns: full name, birth date, birth place, death date, death place, parents, notes.
- Person IDs are lowercase-hyphenated, generated from names (e.g., "Mary Hurst" → "mary-hurst").

### Required Fields in people.json

Every person record MUST contain:
- `id`, `name`, `bio`, `birth`, `death`, `timeline`, `confidence`
- `keyEvent` (key life milestone)
- `summary` (relationship to family/archive)
- Optional: `lifespan`, `birthPlace`, `era`, `branch`, `tags`, `portrayed`, `featured`, `sourceCitation`, `attachedDocument`

### Timeline Entry Structure

```json
{
  "title": "Marriage",
  "date": "1908-09-21",
  "place": "Vancouver, Washington",
  "summary": "Married [spouse]. [Context].",
  "confidence": "Primary Source"
}
```

NOT the old format: `year`, `event`, `confidence` alone. Every timeline entry must include `title`, `date`, `place`, `summary`, `confidence`.

### Required Fields in documents.json

Every document record MUST contain:
- `id`, `title`, `filename`, `date`, `confidence`
- `whatItProves` — What claim this document establishes (never blank)
- `claim` — What the document asserts about the family (never blank)
- `evidence` — Why it's reliable (e.g., "Primary source: official land patent initialed by President John Quincy Adams")
- `narrative` — Human-readable explanation (never blank)
- `sourceCitation` — Full citation with archive/microfilm/court records
- `people` — Array of family member names linked to this document
- Optional: `place`, `archiveCategory`, `notes`, `description`

**Document Validation**: Tests fail if `whatItProves`, `claim`, `evidence`, or `narrative` are empty, null, or blank strings.

**File Storage**: Copy JPGs/PDFs to `public/documents/` with lowercase-hyphenated naming (e.g., `elizabeth-e-dyer-will-1909.jpg`). Always track in `documents.json` with full metadata.

### Negative Search Logging

- Document all search attempts — including zero-result searches — with dates and parameters in `genealogy_research/search_queries.md`.
- Include conflation analysis findings for future reference.
- This prevents redundant token/credit consumption and tracks research progression.

### Test-Driven Verification

- Always run `npm test` before committing or deploying changes.
- The test suite (`__tests__/archive-integrity.test.ts`) enforces:
  - Confidence vocabulary compliance (🟢 / 🔵 / 🟠 / 🟣 only)
  - Document-person link resolution (all linked people must exist)
  - Record frame completeness (whatItProves, claim, evidence, narrative never blank)
  - Source citation presence
  - Regression prevention on key lineage profiles (Charles Dyer 12th Virginia Regiment, William Moore Ballymena printer, Josiah Ramsey Tennessee line, etc.)

### Pre-Deployment Checklist

Before running `vercel deploy --prod`:
- [ ] CSV changes synced to JSON via `sync_data.py`
- [ ] New person records have: `bio`, `keyEvent`, `summary`, `confidence`, `timeline` (with `title`, `date`, `place`, `summary`, `confidence`)
- [ ] New document records have non-empty: `whatItProves`, `claim`, `evidence`, `narrative`
- [ ] All people in document `people` arrays resolve to existing records
- [ ] `npm test` passes (10/10 tests)
- [ ] `npm run build` succeeds with no pre-render errors
- [ ] Check `/ancestors` and `/documents` pages render correctly
- [ ] Update `genealogy_research/search_queries.md` with findings
- [ ] Deploy: `vercel deploy --prod` and verify production URL loads

---

## The CARDO REI Method

All research, data logging, and code development must follow this method:

- **C — Collect**: Gather all names, dates, places, stories, documents, photos. Do not filter prematurely.
- **A — Analyze**: Examine each piece of evidence. Identify its type, limitations, what it explicitly says and does not say. Look for conflations.
- **R — Record**: Document details with full citations, noting what they prove/disprove and where they fit in the timeline.
- **D — Distinguish**: Keep evidence separate from interpretation, facts separate from family stories, direct proof separate from inference. Separate conflated individuals.
- **O — Organize**: Maintain clear structure linking people to documents, documents to events, events to chronological timelines.
- **R — Review**: Actively check for chronological gaps and conflicts, verify assumptions, define limits of evidence, apply conflation filters.
- **E — Evaluate**: Assign explicit confidence levels (🟢 / 🔵 / 🟠 / 🟣) to every claim.
- **I — Iterate**: Treat the archive as living project; continually loop back to resolve discrepancies, research new leads, refine data.

---

## Quick Reference: Current State

- **Archive**: 118 people records, 75 documents
- **CSV Source**: 65 verified people in `genealogy_research/people.csv`
- **Build Status**: All tests passing ✅, deployed to Vercel
- **Recent Additions**: 
  - Mary Hurst family expansion (13 new Dyer records + parents)
  - George Hollis Dyer/Ruby O. Prince marriage (1908) + Elizabeth E. Dyer will (1909)
  - 7 new people records from wills/marriage records

## When Helping with Archive Work

**I will:**
1. Validate all evidence tier vocabulary (reject non-standard values)
2. Apply family-only principle (flag unrelated same-names)
3. Detect conflations using geographic/timeline analysis
4. Ensure CSV↔JSON sync before changes
5. Verify all required fields before adding records
6. Test locally (`npm test` + `npm run build`) before production deployment
7. Document research findings and next steps in `search_queries.md`

**I will NOT:**
- Add records without primary source evidence
- Merge different people without connecting documents
- Allow blank/null values in required fields
- Deploy without all tests passing
- Commit unrelated fixes (focus on task at hand)

---

## Key File Locations

| File | Purpose |
|---|---|
| `data/people.json` | Web app people data (118 records, auto-synced from CSV) |
| `data/documents.json` | Web app documents data (75 records, primary sources + evidence) |
| `genealogy_research/people.csv` | Source of truth for people (65 verified records) |
| `genealogy_research/search_queries.md` | Research log, conflation analysis, next steps |
| `.agents/skills/genealogy_helper/scripts/sync_data.py` | CSV → JSON sync script |
| `__tests__/archive-integrity.test.ts` | Data integrity test suite (10 tests) |
| `public/documents/` | Stored JPGs/PDFs (75 images) |
| `vercel.json` | Production deployment config |
