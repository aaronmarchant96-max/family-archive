<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Game Prototypes and Design

## 1. Children of the Frontier

- File path: `/public/children_of_frontier.html`
- Concept: a standalone caravan management prototype with weather, events, hunting, checkpointing, and crew status.
- Core loop: travel, trigger roadside events, manage resources, then recover at checkpoints or camp.

### Controls

- `Travel Day` advances the caravan.
- `Hunt` opens the click-based hunting screen.
- `Camp` restores morale and health at a cost.
- `1` / `2` select clan on the start screen.
- `Enter` starts the run and can also confirm the first available event choice.
- `Escape` pauses and resumes the run.

### Rules

- The caravan tracks distance, rations, ammo, medicine, karma, wagon integrity, and wheels.
- Weather affects travel pace, resource use, and encounter flavor.
- Roadside scenes appear during travel to keep the run moving and varied.
- Trait-gated choices are allowed, but the game should avoid soft-locking the player.
- Hunt shots should clear cleanly when the hunt ends.

## 2. Server Hosting Updates

- Local testing can run directly from the `public/` directory.
- The current local server target is port `8009`.
- That setup keeps the standalone HTML prototype accessible without changing the Next.js app structure.

## 3. UI / Art Notes

- The caravan should read as a covered wagon, not a generic cart.
- Crew cards should feel more like a management board: readable health, morale, and status at a glance.
- Hunt silhouettes need to stay simple and readable at speed.
- Roadside scenes should add variety without making the game feel slow.

## 4. Test Suite Integration

### Location

- Jest test file: `__tests__/children-of-frontier.test.ts`

### Execution

- Run the prototype test suite with:

```bash
npm test
```

### Test approach

- Use a headless Node `vm` sandbox to execute the game logic.
- Mock the minimal DOM surface needed by the prototype.
- Verify gameplay rules without needing a browser.
- Keep regression coverage on the Karma infinite-lives issue so the caravan cannot silently gain unbounded retries again.

### What to test

- Event resolution moves the game forward.
- Checkpoint restores work after collapse.
- Hunt mode clears transient shot markers.
- Caravan and hunt state stay in sync after mode transitions.
- No soft-lock occurs when event options are trait-gated.

## 5. Working Rule

- Prefer the Jest + Node VM lane for logic changes.
- Use the browser only for visual confirmation after the test lane is stable.
- Keep future prototype changes reflected in this file so other agents can continue without re-explaining the setup.

