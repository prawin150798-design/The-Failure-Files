# The Failure Files

A browser-based automotive engineering investigation game. Open `index.html` or build the standalone HTML file.

## Campaign
**Cases 001–005** — investigate vehicles and automotive systems through inspection, diagnostic tests, repair or configuration, and independent validation.

1. **The Cooling Crisis** — petrol hatchback cooling system: coolant flow, heat transfer and engine temperature.
2. **The Missing Gear** — manual transmission: synchroniser wear, clutch drag and gear engagement.
3. **The Unstable Engine** — motorcycle fuel injection: fuel pressure, air-fuel ratio and engine response.
4. **The Long Stop** — automotive braking: hydraulic pressure retention, master-cylinder bypass and brake performance.
5. **The Inventor’s Prototype** — experimental automotive drivetrain: ratio, torque, clamping pressure and slip.

## Endless Investigation
After the campaign, generate repeatable automotive investigations with hidden faults, difficulty tiers, misleading clues, compound faults, diagnostic budgets, replay codes and independent acceptance tests. The procedural pool contains automotive engine/cooling, manual transmission, EFI and experimental drivetrain platforms only.

## Engineering and progression
- Inspect components, compare readings at different loads and operating conditions, form hypotheses, choose repairs and validate the result.
- The simulation links fault effects to measurable values rather than simply marking a chosen answer correct.
- Campaign progress, replay codes and local saves are retained in the browser.
- The inventor mystery is uncovered through campaign archive fragments and experimental drivetrain investigations.

## Core files
- `automotive-vehicle-database.js` — vehicle specifications and connected systems.
- `machine-database.js` — automotive investigation platforms and diagnostic tools.
- `fault-engine.js`, `simulation-engine.js`, `diagnostic-engine.js` and `acceptance-engine.js` — faults, measurements and independent repair validation.

## Development
- `node run-tests.js` — engine regression tests, including replay, acceptance, diagnostic coverage and automotive-only case generation.
- `node build-standalone.js` — rebuild the standalone HTML after editing a module or `index.html`.

The game stores progress locally in this browser.