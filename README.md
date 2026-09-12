# car-racing

> My doozie Nuxt.js project — a small canvas car-racing game.

Built with **Nuxt 4** (Vue 3 + Vite) and **Tailwind CSS v4**.

## Play it

https://vernonht.github.io/vue-car-racing/

- `/game` — Canvas 2D version
- `/game-next` — PixiJS (WebGL/WebGPU) rebuild

## Game

A small lane-dodging canvas game: steer your car past oncoming traffic — every frame survived scores a point, and a single collision ends the run (press **Start** / **Play again** to retry).

**Settings** (top controls, adjustable between rounds):

| Setting | Range | Effect |
| --- | --- | --- |
| Lanes | 3–8 (default 4) | Road width — the canvas grows/shrinks and your car re-centers |
| Speed | 1–20 | How fast the road (and traffic) scrolls |
| Difficulty | Easy / Medium / Hard (default Medium) | Traffic density — cars per wave and how closely the waves are spaced |

**Controls:** `Enter` start · `←` / `→` steer (also the round ◀ ▶ buttons) · on-screen **+ / −** for speed and lanes.

The game ships in **two builds**: `game.vue` renders to a Canvas 2D context, `game-next.vue` is a PixiJS rebuild (sprites + ticker, WebGL/WebGPU). Both share the control shell and lane geometry.

## Screen size

Best experienced on **desktop / landscape** — the canvas grows with the lane count, from **320px wide (3 lanes)** up to **820px (8 lanes)**, so wide roads need a wide screen (default 4 lanes = 420px).

Mobile works too (the round ◀ ▶ buttons are the touch controls) — aim for a viewport ≥ 420px, i.e. most phones in portrait fit 3–4 lanes; pick 5+ lanes on a tablet, desktop, or landscape.

## Credits & copyright

- **Game** — inspired by [Takane Ichinose's CodePen](https://codepen.io/takaneichinose/pen/MjNpXb). Project code © Jian Hao.
- **Soundtracks** — one of the tracks in `public/soundtracks/` plays (randomly chosen) during each run and stops on game over:
  - `OSAKA.mp3`
  - `Been Waiting.mp3`

## Requirements

- Node.js **>= 22.19** (Nuxt 4 engine requirement)

## Setup

```bash
# install dependencies
$ npm install

# serve with hot reload at http://localhost:4000
$ npm run dev

# build for production (Nitro output in .output/)
$ npm run build

# generate static SPA (output in .output/public), for static hosts / GitHub Pages
$ npm run generate

# generate with the GitHub Pages base URL (/vue-car-racing/)
$ npm run build:gh-pages

# preview the production build
$ npm run preview
```

## Project structure

Nuxt 4 layout — application code lives under `app/`, static assets under `public/`:

```
nuxt.config.ts
app/
  app.vue          # root component (<NuxtPage />)
  assets/          # css + game images
  components/      # Logo.vue, SoundtrackPlayer.vue (auto-imported)
  pages/           # index.vue, game.vue, game-next.vue (PixiJS)
  utils/           # lanes.js — shared lane geometry
public/            # served verbatim (favicon.ico, soundtracks/)
```

## Notes

- SPA mode (`ssr: false`) — all logic runs client-side, including the canvas game loop.
- Tailwind CSS v4 is CSS-first: configured in `app/assets/css/main.css`, no `tailwind.config.js` needed.
- The PixiJS build lazy-loads `pixi.js` client-side (`await import('pixi.js')` inside `onMounted`) so it never runs during `nuxt generate`; it needs WebGL/WebGPU and shows a fallback linking to `/game` when unavailable.
- Soundtrack (`/game-next`) is handled by the reusable `SoundtrackPlayer` component (`:playing`, `:muted` props): it picks a random track from `public/soundtracks/` on each play and stops on game over.
