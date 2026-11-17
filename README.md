# The Failure Files

A browser mechanical-investigation game. Open `index.html` (modules load from the same folder) or the single-file `the-failure-files-standalone.html`.

## Modes
**Campaign (Cases 001–005)** — inspect, test, repair or configure, then run the acceptance test. A case completes only when every criterion passes.
1. The Silent Generator: coolant flow, temperature, no shutdown
2. The Missing Gear: grinding-free engagement, ≤50 RPM mismatch, output within ±3%
3. The Unstable Machine: fuel pressure 3.0 ± 0.2 bar, AFR 13.2–14.7 at 4000 RPM, idle 1400–1600 RPM
4. Pressure Drop: 180 bar, ≤5 bar loss in 10 s, no relief bypass
5. The Inventor's Prototype: 580–620 RPM, ≥110 Nm, ≤2% belt slip (many valid configurations)

**Endless Investigation** (unlocks after all five) — procedurally generated cases with a hidden fault, a difficulty tier (Apprentice / Investigator / Master, or adaptive), misleading clues, compound faults, a diagnostic budget and an independent acceptance simulation plus debrief.

## Investigation upgrades (v0.3)
- Field Lab visual theme: graphite panels, signal-orange actions and instrument-lime highlights.
- Endless Mode now includes a hypothesis board, a customer interview, and a maintenance/operating timeline.
- Expanded procedural scenario engine with 20 authored investigation archetypes: shift-change failures, heat-soak, cold-start, load thresholds, repeated cycles, weather triggers, comeback repairs, wrong-part installs, deferred maintenance, sensor disputes, paperwork audits, hidden workarounds, failure cascades, prototype drift, duty-cycle mismatch, progressive degradation, restart resets, boundary-condition tests and speed/load-linked noise.
- Each archetype supplies its own briefing, incident history, operating profile and investigation method; case identity now includes the scenario archetype so changing numeric readings alone is not treated as a new scenario.
- Diagnostic bench controls include load, duration, ambient temperature and machine RPM; readings use the selected conditions.
- The hypothesis board records the player's working diagnosis without revealing whether it is correct until the debrief.
- The original campaign, replay codes, acceptance criteria and local saves are preserved.

## Friendly layer
`plain-language.js` adds a **Simple words** toggle (header) that rewrites technical terms on screen and keeps the real term in brackets, plus customer stories, plain tool descriptions, a green/orange verdict on every reading, a customer-trust meter and three-step hints from Mia. New players start at Apprentice.

## Replay codes
Every generated case has a code such as `FF-AB12CD~i1~3` (base seed ~ tier+rank ~ attempt). Loading it rebuilds the identical case, whatever your play history. Replays award no XP.

## Files
`machine-database.js`, `fault-engine.js`, `simulation-engine.js`, `diagnostic-engine.js`, `difficulty-engine.js`, `acceptance-engine.js`, `case-generator.js`, `progression-engine.js`; the campaign and Endless UI live in `index.html`.

## Development
- `node tests/run-tests.js` — engine regression tests (generation, validation, replay, tools, scoring and 600-seed scenario diversity coverage).
- `node build-standalone.js` — rebuilds the single-file version after editing any module or `index.html`.

Saves use localStorage keys `failureFiles001`, `failureFiles002`, `failureFilesEndless_v1`. All values are game specifications, not real service data.
