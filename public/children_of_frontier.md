<!--
CARDO REI methodology applied to this document.
Reference: [CARDO REI Methodology](PROMPTHOUND-DOCS/CARDO-REI.md)
-->

# Children of the Frontier

Standalone trail-management game for the family archive.

## Launch

- Open `public/children_of_frontier.html` directly in a browser.

## What is in the build

- Clan selection: Dyer or Ramsey
- Resources: distance, rations, ammo, medicine, karma, wagon integrity, wheels
- Weather loop: Clear, Rainy, Snowy, Dusty, Foggy
- Hardcoded event deck with trait-gated choices
- Hunting minigame with mouse click shots
- Camp dialogue, checkpoint snapshots, grave log, pause overlay

## Notes for follow-up work

- Startup flow has been cleaned up so there is one boot path.
- Event resolution now uses one active path instead of duplicate handlers.
- Wagon integrity was added so rain has a visible effect on the trail.
- Choice cards now have a clearer contrast and the incident header no longer crowds the buttons.
- The event console click path was restored with a real `resolveEvent()` handler.
- Added a compact trail ledger above the console so day, mode, weather, and upcoming checkpoint/event are visible at a glance.
- Added random roadside scenarios during travel and expanded the event deck with more writing variety.
- Menu keyboard shortcuts now work: `1` / `2` select a clan and `Enter` starts the run.
- Help copy now explains the new roadside scenarios and ledger instead of the older sparse flow.
- Travel pace is faster now and incident gates hit more often so the run feels less slow.
- The hunt minigame is harder now: faster animal spawns, shorter timer, smaller deer hitboxes, and deer silhouettes that read more clearly.
- The hunt screen now leans more into a Fallout Shelter-like management feel with tighter HUD/status presentation and quicker pacing.
- Added a no-softlock fallback for incident choices: if every option is trait-locked, the first choice is reopened and `Enter` can select the first available option.
- Redrew the caravan so it reads as a covered wagon with a clearer team and hitch.
- Cleared hunt-only shot particles on exit so no stray bullet markers linger after hunting ends.
- Simplified the deer and buffalo silhouettes so they read more cleanly at a glance.
- Crew cards now use status-colored left borders so health/morale state is readable faster.
- Trail art now has a clearer roadbed and stronger wagon silhouette.
- Hunt art now uses simpler deer/buffalo shapes and a darker ground band for better readability.
- Roadside scenes now draw from a larger, context-aware pool instead of pure random repeats.
- Rain, snow, dust, and fog now get their own themed roadside scenes for better variety.
- Incident choices are no longer hard-disabled when a trait is missing; they stay clickable and explain the trait bonus in the label text.
- Added a Jest regression test so incident buttons stay clickable after an event appears.
- The sandbox-friendly choice renderer now stores the selected index in a plain property, so the VM tests and browser both work.
- Real genealogy anchors now feed archive scenes into the trail loop from the v2 CSVs.
- Evidence tiers now score explicitly so Primary Source, Strong Evidence, Family Memory, and Needs Review can be tested in Jest.
