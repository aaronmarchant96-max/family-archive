<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Marchant Family Archive — Full Context Briefing
# For: GitHub Copilot Chat | Date: 2026-06-26

---

## Repo

**GitHub:** https://github.com/aaronmarchant96-max/family-archive
**Deployed:** Vercel (Next.js static + SSR)
**Local path:** `/home/potatoking/family-archive`
**Research data:** `/home/potatoking/genealogy_research/`
**Agent rules:** `/home/potatoking/.agents/AGENTS.md` and `/home/potatoking/AGENTS.md`

---

## What This Project Is

A personal genealogy archive for the Marchant/Dyer/Ramsey/Moore/Bowen family lines. It's a Next.js web application that renders family history profiles, documents, and timelines — deployed on Vercel and maintained through a multi-agent AI pipeline.

This is not a casual family tree app. It's built with the same data-integrity standards you'd apply to a research database: typed evidence tiers, citation requirements, structural integrity tests, and a formal research method called CARDO REI (Collect, Analyze, Record, Distinguish, Organize, Review, Evaluate, Iterate).

---

## What We Are Trying To Do (Current Sprint)

We are in the middle of a **four-phase archive hardening sprint**, using a Codex plan that runs out tomorrow. The four phases are:

1. **Data foundation** — populate the full relationship graph (mother_id, father_id, spouse_ids, child_ids) across all 118 person profiles; run a round-trip validator to prove no data was lost in the v2 migration; resolve duplicate/ambiguous identities
2. **Validation hardening** — make the chronology plausibility test meaningful across the full archive; add orphan-reference checks and birth/death ordering tests
3. **Frontend wiring** — render the new relationship block on person profile pages in the React app
4. **Platformization** — SQLite + REST layer (post-sprint, not started)

The **immediate next action** is to send Codex:
- First: `codex_close_open_gaps.md` (small surgical tasks — retire v1 ETL script, add verification gate to ETL)
- Then: `codex_master_plan.md` (the four-phase plan)

We also have a ready-to-execute plan for restoring Elizabeth Ellen Conlee Dyer and her 5 children to the archive (`copilot_elizabeth_dyer_restoration.md`).

---

## The Tech Stack

### Frontend
- **Framework:** Next.js (App Router)
- **Language:** TypeScript + React
- **Styling:** CSS modules
- **Deploy:** Vercel
- **Data:** reads from `family-archive/data/people.json` and `family-archive/data/documents.json`

### Data Layer
- **Source of truth:** CSV files in `/home/potatoking/genealogy_research/v2/`
  - `people.csv` — 118 person profiles
  - `documents.csv` — primary source documents
  - `timeline.csv` — chronological events per person
  - `locked_facts.json` — machine-readable list of verified facts that must not drift
  - `chronology_exceptions.json` — known date contradictions that are exempt from the chronology test
  - `name_collisions.json` — same-name pairs flagged for human review

- **ETL script:** `genealogy_research/scripts/sync_data_v2.py`
  - Reads v2 CSVs
  - Upserts into `family-archive/data/people.json` and `documents.json`
  - The JSON files are **build artifacts**, not the source of truth
  - The v1 script (`sync_data.py`) only audited — it never wrote. The v2 script writes. v1 is being retired.

- **Support library:** `genealogy_research/scripts/genealogy_v2.py`
  - Shared path constants, `parse_years()`, `normalize_name()`, relationship dataclasses

### Testing
- **Framework:** Jest + ts-jest
- **Test files:**
  - `family-archive/__tests__/archive-integrity.test.ts` — 14 tests covering vocabulary, evidence tiers, citation requirements, duplicate IDs, lineage regression guards
  - `family-archive/__tests__/genealogy-v2-schema.test.ts` — 3 tests covering chronological plausibility, document type vs extracted_snippet alignment, locked facts consistency
- **Current status: 17/17 tests passing**
- Pipeline rule: **if npm test fails, stop and do not commit**

### Environment
- **OS:** Linux (Ubuntu)
- **Node:** v20.20.2
- **npm:** 10.8.2
- **Python:** 3.10.12
- **Hardware:** Intel Celeron J4105, 7.6 GB RAM (low-spec machine — keep searches tight)

---

## The Multi-Agent Pipeline

### Agents and Roles

| Agent | Model | Role |
|---|---|---|
| **AGY (Antigravity)** | Gemini (Google DeepMind) | Research analysis, CARDO REI evaluation, plan writing, first-pass summaries |
| **Copilot Pro** | Claude Haiku / Sonnet (Anthropic) | Plan execution, CSV edits, pipeline runs, git commits, repetitive validation |
| **Codex** | GPT (OpenAI) | Repo inspection, surgical edits, test writing, validation, cleanup — **expires tomorrow** |
| **Local CLIs** | — | `rg`, `fd`, `git diff`, `npm test` — never spend model tokens on what a CLI can answer |

Two model families (Gemini + Anthropic) act as cross-verification. When both agree, confidence is high. When they diverge, it's a signal worth investigating.

### How the Pipeline Works

```
User downloads a document from Ancestry/FamilySearch
    ↓
AGY (me) analyses the scan — applies CARDO REI
    ↓ writes ↓
copilot_[name]_plan.md  (structured execution plan with VERIFICATION_CONFIRMED field)
    ↓ human reviews image vs. plan claims ↓
VERIFICATION_CONFIRMED: true  (human sets this — it's the only anti-hallucination gate)
    ↓
Copilot/Codex reads plan → appends rows to v2 CSVs
    ↓
python3 sync_data_v2.py  (ETL: CSV → JSON)
    ↓
npm test  (17 integrity checks — hard stop if any fail)
    ↓
git commit + Vercel deploy
```

### The Verification Gate (Critical)

Every plan file I write includes:
```
VERIFICATION_CONFIRMED: false
```

The human must physically open the source image alongside the plan, verify every claim is visible in the scan, then change it to `true`. Only then does Copilot/Codex execute.

This is the **only defence against hallucination** in the pipeline. Automated checks catch structural corruption (duplicate IDs, vocabulary violations, chronology breaks) — but they cannot detect a factually false but structurally valid entry. The human gate does.

The `sync_data_v2.py` script is being upgraded to enforce this: if passed a `--plan-file` argument and the file doesn't contain `VERIFICATION_CONFIRMED: true`, the script hard-stops with instructions.

---

## The CARDO REI Method

Every document intake and profile update must follow this cycle:

| Step | What it means in practice |
|---|---|
| **C — Collect** | Gather everything on the document — names, dates, places, all details |
| **A — Analyze** | What type of record is this? What are its limitations? What does it explicitly say vs. not say? |
| **R — Record** | Write with full citation. Note what is proved and what is NOT proved. |
| **D — Distinguish** | Keep evidence separate from interpretation. Facts separate from family stories. |
| **O — Organize** | Link person → document → event → timeline |
| **R — Review** | Check for chronological gaps, conflicts, assumptions |
| **E — Evaluate** | Assign an evidence tier (see below) |
| **I — Iterate** | This is a living archive. Loop back as new evidence arrives. |

### Evidence Tiers

| Tier | Meaning |
|---|---|
| `Primary Source` | Original document directly examined (marriage register, death certificate, military discharge) |
| `Strong Evidence` | Good secondary/compiled records — census, Ancestry profile with multiple corroborating sources |
| `Corroborated Compilation` | Compiled source cross-checked against at least one primary |
| `Needs Review` | Unverified index entry, single compiled source, not yet checked |
| `Family Memory` | Oral history, family tradition — valuable but not proof |
| `Family-Confirmed Oral History` | Attributed by family members across multiple independent trees (e.g. Ancestry photos saved by 10+ researchers) |

---

## The v2 Schema Migration (Completed by Codex)

The original `people.json` had rich nested data but no flat CSV equivalent. We migrated to a v2 CSV schema that is the true SSOT:

### v2 people.csv columns
```
person_id, name, birth, death, birth_year, death_year, branch, summary,
key_event, confidence, source_citation, mother_id, father_id, mother_name,
father_name, spouse_ids, child_ids, notes
```

Key improvements over v1:
- `mother_id` and `father_id` are separate fields (not a flat `parent_ids` list) — required for chronological plausibility tests
- `birth_year` and `death_year` are explicit integer columns (v1 required regex parsing of a `lifespan` string)
- `spouse_ids` and `child_ids` are pipe-delimited lists (`P001|P002`)

### v2 documents.csv columns
```
document_id, filename, type, date, date_year, place, people_ids, branch,
confidence, source_citation, fact, meaning, extracted_snippet, notes, evidence_tier
```

Key field: `extracted_snippet` — verbatim text visible in the scan. This is the Andrew Moore tripwire: if I hallucinate a fact from a document, the extracted_snippet can be checked against the actual image. The `genealogy-v2-schema.test.ts` test verifies that the snippet and document type are consistent.

---

## Current State

### What's working
- 17/17 Jest tests passing
- v2 CSV schema with `mother_id`/`father_id` split
- Chronological plausibility test (catches parents aged <13 or >80/55 at child's birth)
- Locked facts enforcement (painter vs printer, Springwell Street)
- Known contradictions in `chronology_exceptions.json` (Mary Bowen 1745 death vs 1748 child)
- `sync_data_v2.py` writes JSON (v1 only audited)
- Couple portrait of George Washington Dyer + Elizabeth Ellen Conlee Dyer in archive

### What's open
| Gap | Status |
|---|---|
| v1 `sync_data.py` still exists alongside v2 | ⚠️ Plan written, sending to Codex |
| Verification gate has no technical enforcement | ⚠️ Plan written, sending to Codex |
| Relationship graph mostly unpopulated | ⚠️ Phase 1B — the big Codex task |
| Round-trip migration validator doesn't exist yet | ⚠️ Phase 1A |
| Duplicate/ambiguous identities unresolved | ⚠️ Phase 1C (`name_collisions.json` exists) |
| Frontend doesn't render relationship fields | ⚠️ Phase 3 |
| Elizabeth Ellen Conlee Dyer restoration pending | ⚠️ Plan written, ready to execute |

### Recent significant discovery
Elizabeth Ellen Conlee Dyer (1850–1909) was incorrectly split into two people during an earlier cleanup. Her maiden name (Conlee/Conley) and married name (Dyer) were treated as different people. Ancestry profile + 1909 Pine City will scan confirm they are the same person. She had 5 children with George Washington Dyer — Carpus Melvin, Nancy, Glenn Milton, Fredrich Marion, and George Hollis — all of whom were removed from the archive in the incorrect cleanup. Restoration plan is written and verified.

---

## Key Files to Know

| File | Purpose |
|---|---|
| `/home/potatoking/genealogy_research/v2/people.csv` | Primary source of truth for all persons |
| `/home/potatoking/genealogy_research/v2/documents.csv` | Document records with extracted_snippet |
| `/home/potatoking/genealogy_research/v2/timeline.csv` | Per-person chronological events |
| `/home/potatoking/genealogy_research/v2/locked_facts.json` | Verified facts that must not drift (data-driven, not hardcoded) |
| `/home/potatoking/genealogy_research/v2/chronology_exceptions.json` | Known date contradictions, explicitly exempted |
| `/home/potatoking/genealogy_research/v2/name_collisions.json` | Same-name pairs flagged for human review |
| `/home/potatoking/genealogy_research/scripts/sync_data_v2.py` | ETL: reads v2 CSVs, writes family-archive JSON |
| `/home/potatoking/genealogy_research/scripts/genealogy_v2.py` | Shared library (path constants, parsers, dataclasses) |
| `/home/potatoking/family-archive/data/people.json` | Build artifact — regenerated by sync_data_v2.py |
| `/home/potatoking/family-archive/data/documents.json` | Build artifact — regenerated by sync_data_v2.py |
| `/home/potatoking/family-archive/__tests__/archive-integrity.test.ts` | 14 integrity tests |
| `/home/potatoking/family-archive/__tests__/genealogy-v2-schema.test.ts` | 3 v2 schema tests |
| `/home/potatoking/.agents/AGENTS.md` | Project-scoped agent rules (intake standards, verification gate, CARDO REI rules) |
| `/home/potatoking/AGENTS.md` | Global agent rules (operating model, handoff format, token efficiency) |

---

## What We've Already Tried / Lessons Learned

1. **The Elizabeth Cowan problem** — A profile had her as mother of children born when she would have been 83. This is what drove the `mother_id`/`father_id` split and the chronological plausibility test.

2. **The Andrew Moore hallucination** — An AI confidently attributed a Calgary city directory entry to the wrong Andrew Moore. This is what drove the `extracted_snippet` field — verbatim text from the scan that can be verified against the image.

3. **The painter/printer drift** — William Moore's occupation drifted from "painter" (correct, per the PRONI marriage certificate) to "printer" in a summary edit. This is now a locked fact in `locked_facts.json` with `must_include: ["painter"]` and `must_exclude: ["printer"]`.

4. **Single sync script confusion** — The v1 `sync_data.py` was designed to audit and report, not to write JSON. The JSON was being manually edited, causing the CSV and JSON to diverge. The v2 ETL script now writes JSON programmatically, making divergence impossible.

5. **Flat `parent_ids` field** — An earlier schema had a single `parent_ids` pipe-delimited field. This made it impossible to write a chronology test that knew which parent was mother and which was father (required for biologically plausible age-at-birth checks). Split to `mother_id` and `father_id`.

---

## Stop Conditions (Non-Negotiable)

- If `npm test` fails: **stop, do not commit, report test names**
- If `sync_data_v2.py` schema error: **stop, do not commit**
- If round-trip validator finds field loss: **stop, fix serializer, do not proceed to relationship population**
- If a relationship cannot be supported by existing notes/summaries/source text: **mark as Needs Review, do not guess**
- If a duplicate pair cannot be resolved confidently: **do not merge silently**
- If `VERIFICATION_CONFIRMED` is not `true` in a plan file passed to `sync_data_v2.py --plan-file`: **script hard-stops**
- If a git merge conflict arises: **stop, do not force-push**

---

## Rollback Plan

Before Phase 1B (relationship population) begins, Codex must create a git tag:
```bash
git -C /home/potatoking/family-archive tag pre-relationship-population-$(date +%Y%m%d)
```

If anything goes wrong mid-run:
```bash
git -C /home/potatoking/family-archive checkout pre-relationship-population-20260626 -- data/people.json
```

Phase 1B runs **branch-by-branch** (Dyer → Ramsey → Moore → Bowen → other), committing after each branch passes tests. If token budget runs out mid-run, completed branches are committed and safe. Remaining branches wait for Copilot.
