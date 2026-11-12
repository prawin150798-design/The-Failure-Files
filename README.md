# The Failure Files — Case 001

A self-contained, responsive browser game prototype.

## Play
Open `index.html` in a modern browser on desktop or mobile.

## Progress
The game saves investigation progress in the browser's localStorage on that device. It does not sync between devices.

## Case loop
Inspect components → run diagnostic tests → compare readings → choose a repair → validate under load → recover the archive clue.

## Notes
This is a first vertical-slice prototype. The thermal/coolant model is intentionally simplified, but the main causal relationships are simulated: load adds heat; coolant circulation and radiator effectiveness remove heat; a damaged impeller reduces flow and causes overheating under load.
