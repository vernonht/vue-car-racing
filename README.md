# car-racing

> My doozie Nuxt.js project — a small canvas car-racing game.

Built with **Nuxt 4** (Vue 3 + Vite) and **Tailwind CSS v4**.

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
  components/      # Logo.vue (auto-imported)
  pages/           # index.vue, game.vue
public/            # served verbatim (favicon.ico)
```

## Notes

- SPA mode (`ssr: false`) — all logic runs client-side, including the canvas game loop.
- Tailwind CSS v4 is CSS-first: configured in `app/assets/css/main.css`, no `tailwind.config.js` needed.
