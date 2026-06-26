# Marchant Family Archive — Project Rules

These rules govern all development, data entry, and research work on the Marchant Family Archive.

## Genealogy Standards

### Evidence Tiering

Always label evidence with its confidence tier:

- 🟢 **Primary Source** — Original civil or parish register entries directly examined.
- 🔵 **Strong Evidence** — Good secondary/compiled records or census clusters.
- 🟡 **Family Memory** — Compiled notebooks (e.g. Red Book) or oral history.
- 🟠 **Needs Review** — Unverified index entries or anything not yet confirmed.

Oral tradition and family stories must NEVER be labeled as Primary Source.

### Disambiguation & Same-Name Policy

- Maintain **separate working profiles** for same-name individuals in different locations (e.g., Patrick Law in Ballymena vs. Strabane) until linked by direct primary evidence.
- Treat any contemporary names in census or Griffith's valuation as separate profiles until explicitly linked.

### Data Integrity & Synchronization

- Always run `sync_data.py` (at `.agents/skills/genealogy_helper/scripts/sync_data.py`) to keep `data/people.json` and `data/documents.json` aligned with the raw research CSVs (`genealogy_research/people.csv` and `genealogy_research/timeline.csv`).
- **Do not** make manual data entries directly to the JSON files without first updating the CSV sources.

### Negative Search Logging

- Document all search attempts — including zero-result searches — with dates and parameters in `genealogy_research/search_queries.md`.
- This prevents redundant token/credit consumption.

### Test-Driven Verification

- Always run `npm test` before committing or deploying changes.
- The test suite (`__tests__/archive-integrity.test.ts`) enforces vocabulary constraints, resolves document-person links, prevents oral tradition from being mislabeled, and guards key lineage profiles (Charles Dyer, William Moore, Josiah Ramsey) against regressions.

---

## The CARDO REI Method

All research, data logging, and code development must follow this method:

- **C — Collect**: Gather all names, dates, places, stories, documents, photos. Do not filter prematurely.
- **A — Analyze**: Examine each piece of evidence. Identify its type, limitations, what it explicitly says and does not say.
- **R — Record**: Document details with full citations, noting what they prove/disprove and where they fit in the timeline.
- **D — Distinguish**: Keep evidence separate from interpretation, facts separate from family stories, direct proof separate from inference.
- **O — Organize**: Maintain a clear structure linking people to documents, documents to events, and events to chronological timelines.
- **R — Review**: Actively check for chronological gaps and conflicts, verify assumptions, define the limits of evidence.
- **E — Evaluate**: Assign explicit confidence levels (🟢 / 🔵 / 🟠 / 🟡) to every claim.
- **I — Iterate**: Treat the archive as a living project; continually loop back to resolve discrepancies, research new leads, refine the data.

---

## Key File Locations

| File | Purpose |
|---|---|
| `data/people.json` | Web app people data (auto-generated — do not edit directly) |
| `data/documents.json` | Web app documents data (auto-generated — do not edit directly) |
| `genealogy_research/people.csv` | Source of truth for people records |
| `genealogy_research/timeline.csv` | Source of truth for timeline events |
| `genealogy_research/search_queries.md` | Log of all search attempts |
| `.agents/skills/genealogy_helper/scripts/sync_data.py` | Sync script |
| `__tests__/archive-integrity.test.ts` | Integrity test suite |
