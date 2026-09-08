// https://nuxt.com/docs/getting-started/configuration
import tailwindcss from '@tailwindcss/vite'

// Router base for GitHub Pages (see `npm run build:gh-pages`)
const isGhPages = process.env.DEPLOY_ENV === 'GH_PAGES'

export default defineNuxtConfig({
  // SPA mode (Nuxt 2 `mode: 'spa'`)
  ssr: false,

  // Nuxt 2 `server: { port: 4000, host: '0.0.0.0' }`
  devServer: {
    host: '0.0.0.0',
    port: 4000
  },

  app: {
    baseURL: isGhPages ? '/vue-car-racing/' : '/',
    head: {
      title: 'car-racing',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'My doozie Nuxt.js project' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Tailwind v4 (CSS-first) entry
  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()]
  }
})
