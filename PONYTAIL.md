# Ponytail Audit — car-racing

Scope: `app/pages/game.vue` — dynamic-lane feature (3–8 lanes, canvas resizes) and the game-control UI, reviewed under the ponytail ladder (YAGNI → reuse → stdlib → native → dependency → one line → minimum code).

Status legend: **[done]** applied · **[open]** waiting on a decision · **[skip]** reviewed and deliberately not changed

---

## 1. Lane dividers were a second source of truth — **[done]**

`data.line.dashes` duplicated `data.moves` (dash x = lane centre − 15px) but was read in exactly one place (`initLines`). Deleted the stored array, the build loop, and `LANE.dashX`; `initLines` now derives dividers from `data.moves` on the spot.

**Why:** one geometry array instead of two; nothing else could desync.
**Upgrade path:** none needed — if dividers ever get their own pitch, promote `moves.map(x => x - 15)` back into a small `dividers(moves)` helper.

## 2. `setLaneCount` cleared scenery that could never be visible — **[done]**

`lines.value = []` / `car2.value = []` ran on lane change, but both are only drawn while `game && !die` and `start() → initialize()` rebuilds them before every race; the canvas resize also wipes the bitmap anyway. Removed.

**Why:** unreachable-in-effect code.
**Upgrade path:** none.

## 3. `setCurrentSpeed()` / `maxSpeed` are dead code — **[open]**

`maxSpeed = ref(20)` and `setCurrentSpeed()` (clamps speed to 1–20) were added, but the **+/−** buttons still call `currentSpeed++` / `currentSpeed--`, so nothing invokes the clamp and speed can exceed 20.

**Decision needed — pick one:**
- wire the +/− buttons to `setCurrentSpeed(currentSpeed ± 1)` and disable them at the 1/20 ends (also fixes: minus at 1, plus at 20), or
- delete `maxSpeed` + `setCurrentSpeed` until clamping is actually wanted.

**Why not done:** changing button behavior wasn't part of the requested feature; half-wired clamp code is worse than either end state.

## 4. `drawCar1` left/right turn duplication — **[skip]**

`car1Turn === 1/2` branches could collapse to a signed delta (`car1.value[0] += data.car1.turn * (car1Turn === 1 ? -1 : 1)`). Deliberately unchanged: it's working game-loop logic, the diff is cosmetic, and touching it risks an edge-case regression for zero behavior change.

**Upgrade path:** only if `drawCar1` is touched for a real reason.

## 5. Road texture under `background-size: cover` at 6–8 lanes — **[open]**

`#canvas` scales `socargame-01.png` with `cover`, so at wider lane counts the road graphic is zoomed/cropped.

**Options:** `background-repeat: repeat-x` with a tileable strip, or a wider sprite. Cosmetic; decide when the lane widths feel final.

## 6. Gamepad arrows spread to the full canvas width — **[open]**

The ◀ / ▶ / Start row spans `.box` width, so at 8 lanes (820px) the arrows sit ~700px apart.

**Options:** cap the row width (e.g. `max-width: 420px; margin-inline: auto`) or center the cluster. Cosmetic; decide after playing at 6–8 lanes.

---

### Ledger notes

- Deliberate simplifications in code should carry a `ponytail:` comment naming the ceiling and the upgrade path. Currently none exist in `game.vue` — findings above were applied without needing in-code markers (the code reads plainly after each fix).
- This file lives at the repo root on purpose: `docs/` is generated deploy output and gets wiped on every build sync — do not move audit notes there.
