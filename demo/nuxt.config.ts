import { MountOptions } from '@nuxt/content'

// @ts-ignore
const isStackblitz = process.env.GIT_PROXY?.includes('stackblitz')

// no external demo in stackblitz (due to CORS)
const sources: Record<string, MountOptions> = {}
if (!isStackblitz) {
  sources.ds = {
    driver: 'github',
    repo: 'davestewart/nuxt-content-assets',
    dir: '/demo/external',
    prefix: '/external'
  }
}

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@600;700&display=swap' },
      ]
    },
  },

  modules: [
    '../src/module',
    '@nuxt/content',
    // '@nuxt/devtools',
  ],

  // https://content.nuxtjs.org/api/configuration
  content: {
    sources,
    markdown: {
      anchorLinks: false,
    },
  },

  'content-assets': {
    // add image size hints
    imageSize: 'attrs url',

    // show debug messages
    debug: true,
  },
})

