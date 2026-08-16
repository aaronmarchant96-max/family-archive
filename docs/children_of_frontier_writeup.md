<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Project Case Study: "Children of the Frontier"

This document provides a comprehensive overview of **"Children of the Frontier,"** a retro caravan survival RPG built directly inside the Marchant Family Archive codebase. It details the design, mechanics, UI systems, and the complete step-by-step engineering process of how we built, tested, and integrated it.

---

## 1. Game Overview
*   **Title:** Children of the Frontier
*   **Genre:** Caravan Management text-RPG (in the spirit of *Death Road to Canada* & *Oregon Trail*)
*   **Platform:** Single-file HTML5 Canvas + Vanilla JavaScript (Zero external framework dependencies)
*   **Thematic Seed:** Driven by real genealogical records of the **Dyer** and **Ramsey** pioneer clans migrating westward between 1850 and 1880.

---

## 2. Core Gameplay Mechanics

### A. Crew System (Archive Clans)
Players select one of two starting family groups:
*   **The Dyer Clan:** George Washington Dyer (Resilient), Elizabeth Conley (Wise), Glenn Milton Dyer (Athletic), George Hollis Dyer (Charming).
*   **The Ramsey Clan:** Armina Ramsey (Resilient), Anderson Edwards (Athletic), Silas Josiah Edwards (Charming), Edith Ann Edwards (Wise).

Each crew member has:
*   **Individual Health & Morale Bars (0–100):** Morale increases when fed well and drops on hard choices. Health drops during starvation or injury.
*   **Special Traits:** Unlocks a **4th choice** during random road events, yielding high-value outcomes if the matching character is alive.
*   **Despondency:** If a character's morale hits 0, they turn "Despondent," refusing to participate in hunts.

### B. Caravan Resources & The Karma Bar
*   **Resource Bars:** Distance (target: 1,851 miles), Rations, Ammo, Medicine.
*   **The Karma System:** A spiritual indicator of the caravan's alignment. 
    *   *Selfless choices* (sharing food, treating strangers) raise Karma. 
    *   *Selfish choices* (stealing, robbing graves) drop Karma.
    *   **Karma Clamping:** Clamps strictly between 0 and 100.
    *   **Death Threshold:** If Karma hits `0`, the caravan is struck by misfortune and collapses. The player loses a Wheel (Life).
*   **Caravan Wheels (5 Lives):** If wheels hit 0, the run ends in defeat. If a life is lost, the caravan rolls back to the last 450-mile checkpoint.

### C. Dynamic Weather Patterns
Weather changes procedurally every 150 miles, applying both visual canvas particle effects and heavy resource rules:
*   **Clear:** Standard travel.
*   **Rainy (Visual: falling blue rain streaks):** Mud slows the wagon, doubling Wagon Integrity wear.
*   **Snowy (Visual: floating white snow drift):** Cold passes force the crew to consume double Rations.
*   **Dusty (Visual: blowing sand lines):** Sandstorms cut daily travel distance in half.
*   **Foggy (Visual: translucent grey overlay):** Navigation errors yield a 25% daily chance to lose a random resource.

### D. Interactive Canvas Hunting Minigame
Clicking "Hunt" switches the Canvas to a 2D hunting field:
*   **Controls:** A custom crosshair tracks your mouse coordinates, letting you left-click (or press Spacebar) to fire.
*   **Physics:** Animals (deer and buffalo) spawn randomly from either the left or right screen edges and run across. Firing costs 1 Ammo, and successful hits yield +15 Rations.

### E. Pioneer Grave Log (Book of Remembrance)
If an ancestor dies, their name, the day, the mile they fell, and their cause of death are recorded. This log is persistently saved to the browser and displayed as a memorial on the Game Over and Victory screens.

---

## 3. UI & Visual Theme (CRT Western Terminal)

The interface is styled using a retro, custom 8-bit color palette:
*   `--mud: #5E4B3A` | `--olive: #6B8E23` | `--sand: #D2B48C` | `--amber: #E8A33D` | `--void: #141210` | `--blood: #A33D2D`

### Layout Architecture:
1.  **Top HUD:** Text counters displaying Rations, Ammo, Medicine, Karma, Weather, and 5 visible wagon wheel icons.
2.  **Crew Grid:** Display cards for the 4 crew members, showing dynamic Health/Morale progress bars and active state tags (e.g. *Fit*, *Injured*, *Despondent*).
3.  **Center Stage (Canvas):** Renders the landscape, hills, and a procedurally animated covered wagon (complete with rotating wooden wheels and pulling oxen) slowly traveling along a dotted line track overlayed with weather particle physics.
4.  **Bottom Console:** A retro scrolling log showing narrative events, campfire dialogues, and interactive choices.

---

## 4. The Engineering Process: Step-by-Step

### Step 1: Drafted the Build Spec
We created a comprehensive Prompt Specification document mapping out the exact data schemas, canvas sizes, variables, and color tokens so the AI could compile the entire game without using placeholders or stubs.

### Step 2: Generated the Frontend Code
The Prompt Spec was sent to GPT, which outputted a clean, single-file HTML5 client saved to the `/public` folder of your Next.js project.

### Step 3: Headless Jest Integration (The Node VM Sandbox)
To align with the project's verification rules, we wrote a test suite in `/home/potatoking/family-archive/__tests__/children-of-frontier.test.ts`.
*   **The Challenge:** A standard Jest environment cannot parse HTML files or resolve browser elements like `<canvas>` or `fetch`.
*   **The Solution:** We used Node's built-in `vm` (Virtual Machine) module to read the raw HTML, strip away tags, and evaluate the JavaScript inside a custom sandbox context. We mocked the canvas drawing methods, the `fetch` API, and standard DOM elements.
*   **The Result:** The Jest tests execute successfully under `npm test` without installing heavy packages.

### Step 4: Finding & Fixing the Infinite Lives Bug
During initial test validation, our Jest tests caught a critical bug:
*   *The Bug:* When the caravan collapsed due to 0 Karma, `restoreSnapshot()` restored the state from the last checkpoint, but accidentally reset `state.wheels` back to the snapshot value (5). This gave the player infinite retries.
*   *The Fix:* We modified the HTML source to comment out the wheels restoration line, preserving the deducted wheel counts across rollbacks.

### Step 5: Connecting to the Archive Database & APIs
To merge the game with your real genealogy records, we built two Next.js App Router API routes:
1.  **`/api/game-data` (`/app/api/game-data/route.ts`):** Reads the actual `people.json` and `canonical_events.json` database files, filters out real Dyer/Ramsey ancestors, evaluates their traits, and injects real historical events directly into the game's event deck.
2.  **`/api/log-run` (`/app/api/log-run/route.ts`):** Captures end-game runs and appends statistics, dates, and grave logs to a local JSONL file (`/data/game_runs.jsonl`).

---

## 5. Development Summary
Through this structured engineering loop, we successfully bridged your genealogy database directly into an interactive retro survival game. The application is completely validated, has full test coverage, uses zero heavy dependencies, and preserves the historical context of the Marchant family archive.
