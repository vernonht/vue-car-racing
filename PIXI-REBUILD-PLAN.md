# Plan — Rebuild the game with PixiJS (`app/pages/game-next.vue`)

Status: **implemented** (PixiJS 8.20.1, `app/pages/game-next.vue`, route `/game-next`) — pending a manual browser playtest. Keeps the existing Canvas-2D `app/pages/game.vue` untouched for A/B and rollback.

---

## Summary

Add a second, PixiJS-powered version of the car game at route `/game-next`, with feature parity to the current game — dynamic 3–8 lanes, speed 1–20, lane switching, enemy spawn, collision, score, start/restart, keyboard + touch, audio — but rendered by PixiJS instead of the hand-rolled `setTimeout`/`requestAnimationFrame` loop.

## Why PixiJS, and the one hard constraint

- **Current version:** `pixi.js@8.20.1` (MIT, ESM). v8 API: `await app.init({...})`, `app.canvas`, `app.stage`, `new Sprite(texture)`, `Assets.load(url)`, `app.ticker.add((time) => …)`.
- **Constraint (design around it):** pixi's root import eagerly runs browser-environment init (its npm `sideEffects` includes `lib/environment-browser/browserAll.*`). Importing it at module scope risks the same `"X is not defined"`-in-Node failure we hit during `nuxt generate` in CI.
  → **Import Pixi only inside `onMounted` via `await import('pixi.js')`.** The module top level stays browser-free, and the SSR-on prerender path stays green.

## Architecture: Canvas-2D → Pixi mapping

| Current (`game.vue`) | PixiJS (`game-next.vue`) |
| --- | --- |
| `document.querySelector('#canvas')` + `getContext('2d')` | app appends `app.canvas` into `<div ref="stageEl">`; no manual query/append |
| `setTimeout` + `requestAnimationFrame` loop (fps 180) | `app.ticker.add(tick)` in `app.init`; `app.ticker.maxFPS = data.fps` for parity |
| `fillRect` road dashes + bg image | one `Graphics`/`TilingSprite` road layer; dashes a moving `Container` reused per frame |
| `drawImage(carSprite)` | one `Sprite` per car from `Assets.load` textures (same 5 PNGs) |
| manual `car1Move`/`car1Turn` step tweening | keep the same step logic in `tick` (behavior parity first) |
| `lines`/`car2` arrays + AABB | enemy `Sprite` pool; AABB via `getBounds()` (keep `grace` numbers) |
| resize on lane change | `app.renderer.resize(width, 480)` + relay road/dashes + recenter player |
| `incrementScore` → `#score` pre | keep the **DOM overlay** for score/instructions/lose |
| `beforeUnmount` rAF/timeout cleanup | `app.destroy(true, { children: true })` + remove keydown listener |

**Reuse, don't rewrite:** the Tailwind control shell (speed card, lane stepper, gamepad), the `<audio>` element + `watch(muted)`, keyboard handling, and the lane geometry math (`pitch 100`, `centre = 30 + i*100`, `width = lanes*100 + 20`).

## File-by-file

- **`app/pages/game-next.vue`** (new) — template = same control shell, but the `<canvas id="canvas">` + overlays block becomes `<div ref="stageEl" class="game-stage">` with the overlay `<pre>`s still positioned on top. `<script setup>` with lazy `await import('pixi.js')` in `onMounted`, same settings + input handlers.
- **`app/utils/lanes.js`** (new, optional) — extract the ~6 lines of lane geometry (`laneCentres(n)`, `canvasWidth(n)`, `centreLane(n)`) so both games share one source of truth. *(If you'd rather freeze `game.vue`, keep the math inline in `game-next` and log the duplication as debt in `PONYTAIL.md`.)*
- **`app/pages/index.vue`** — add a second link (`Play (Pixi)`) next to `Play Game`.
- **`package.json`** — add `pixi.js@^8.20.1` to `dependencies` (runtime dep, like nuxt).

## Risks / open questions

1. **Bundle size** — Pixi v8 core adds meaningful JS to the `/game-next` route chunk (lazy route chunk, so the home page is unaffected). Measure after; trim with subpath imports (`pixi.js/app`, `pixi.js/graphics`, `pixi.js/sprite-tiling`) if needed.
2. **Renderer fallback** — Pixi v8 renders via **WebGL/WebGPU only** (no 2D-canvas fallback). On a WebGL-less browser `/game-next` fails where `/game` still works. Add a graceful "WebGL not supported" message.
3. **Crispness** — `app.init({ resolution: window.devicePixelRatio, autoDensity: true })`.
4. **Road texture** — `socargame-01.png` is currently inlined by Vite as a data-URI (< 4KB); `Assets.load` handles data-URIs — confirm at build time.
5. **Keep or retire `game.vue`** — this plan keeps it. Follow-up (out of scope): once `/game-next` reaches parity, swap `/game` or delete the old page.

## Verification

- `npm run build:gh-pages` **and** the SSR-on guard (temporarily `ssr: true`) build clean — proves Pixi is never evaluated in Node.
- `npm run dev` → `/game-next` loads, WebGL context initializes; parity checklist: start via Enter/button, steer via ←/→ and ◀/▶, score climbs, collision ends run, restart works, lane add/remove resizes road + recenters car, speed ± adjusts scroll, audio mutes.
- Side-by-side eyeball vs `/game`.

## Implementation steps

- [x] **step-1 — Add pixi.js dependency.** `pixi.js@^8.20.1` in `dependencies`; install with `npm install --legacy-peer-deps` (this repo's npm quirk). Verify: `node -e "console.log(require('pixi.js/package.json').version)"`.
- [x] **step-2 — Extract shared lane geometry (optional).** `app/utils/lanes.js` with `laneCentres(n)`, `canvasWidth(n)`, `centreLane(n)`; refactor `game.vue` to use it. If freezing `game.vue`: skip + note the debt.
- [x] **step-3 — Scaffold `game-next.vue` shell.** Copy the control shell; swap the canvas block for `<div ref="stageEl" class="game-stage">`; add `<script setup>` state mirroring `game.vue`.
- [x] **step-4 — Pixi app lifecycle (client-only).** `await import('pixi.js')` in `onMounted`; `app.init({ width: canvasWidth(lanes), height: 480, antialias, resolution, autoDensity })`; append `app.canvas`; `destroy` in `onBeforeUnmount`. Module scope browser-free. **Risk: high.**
- [x] **step-5 — Road, sprites, spawn, collision.** `Assets.load` the 5 car PNGs + road; moving dash layer; player `Sprite` with the step tween; enemy `Sprite` pool with existing spawn/despawn; AABB collision with `grace`; score into DOM overlay; `app.ticker.add(tick)`. **Risk: high.**
- [x] **step-6 — Settings: lane resize + speed.** On lane change `app.renderer.resize(...)`, relay road, recenter player; wire the speed clamp (`setCurrentSpeed`). Block lane changes mid-race like `game.vue`.
- [x] **step-7 — Link + verify.** Add `Play (Pixi)` link on `index.vue`; run `npm run build:gh-pages` (+ ssr:true guard) and a dev playthrough.

## Implementation notes (what actually shipped)

- **Deps:** `pixi.js@8.20.1` in `dependencies` (installed with `--legacy-peer-deps`, this repo's npm quirk).
- **Shared geometry:** `app/utils/lanes.js` (`LANE`, `clampLaneCount`, `laneCentres`, `canvasWidth`, `centreLane`) — now used by **both** `game.vue` and `game-next.vue`, so the two can't drift.
- **Lazy import works:** Pixi is loaded with `await import('pixi.js')` inside `onMounted`. Verified with the SSR-on guard (temporarily `ssr: true` → `nuxt generate`): `/game-next` SSR-prerenders cleanly (86 server modules), so the module/setup never touches Pixi in Node. No `Image`/`window` errors.
- **Dashes:** a `Container` of dash `Sprite`s cycled by `y % distance` (not a `TilingSprite`) — exact parity with the original wrap math.
- **Frame-rate independent:** movement uses `currentSpeed * 180 * ticker.deltaMS/1000` (BASE_FPS = 180) so Pixi's display-rate ticker matches the old 180fps feel.
- **Speed clamp wired:** the +/− buttons call `setCurrentSpeed()` and disable at 1 / `maxSpeed` (this is the clamp that was dead code in `game.vue`).
- **Draw order:** road → dashes → player → enemy layer (traffic paints above the player, matching the original draw order).
- **Bundle:** the Pixi chunk is `624.75 kB` / `176.23 kB` gzip, emitted as a **lazy** chunk (only `/game-next` loads it; home is unaffected). Vite warns >500 kB — trim with subpath imports (`pixi.js/app`, `pixi.js/graphics`, `pixi.js/sprite-tiling`) if it matters.
- **Still to do (manual):** browser playtest — WebGL context init, visual parity, collision feel, lane resize at 3–8, mute. Pixi v8 is WebGL/WebGPU-only, so a WebGL-less browser shows the `render-error` fallback (link to `/game`).

## Notes

- Lives at the repo root on purpose: `docs/` is generated deploy output and gets wiped on every build sync — do not move this plan there.
- **ponytail:** prefer reusing the control shell / audio / geometry over reimplementing; import Pixi lazily; delete `game.vue` only after `/game-next` ships.
