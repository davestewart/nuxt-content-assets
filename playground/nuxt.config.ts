import { defineNuxtConfig } from 'nuxt/config'
import type { MountOptions } from '@nuxt/content'

// @ts-ignore
const isStackblitz = process.env.GIT_PROXY?.includes('stackblitz')

// external source
const external = {
  driver: 'github',
  repo: 'davestewart/nuxt-content-assets',
  dir: '/playground/external',
  prefix: '/external'
}

// no external playground in stackblitz (due to CORS)
const sources: Record<string, MountOptions> = {}
if (!isStackblitz) {
  sources.ds = external
}

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@600;700&display=swap' },
      ]
    },
  },

  // @ts-ignore
  modules: [
    '../src/module',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/devtools',
  ],

  // https://content.nuxtjs.org/api/configuration
  content: {
    sources,
    highlight: {
      theme: 'github-light',
      preload: ['js']
    },
    markdown: {
      anchorLinks: false,
    },
  },

  // https://github.com/davestewart/nuxt-content-assets/#configuration
  contentAssets: {
    // add image size hints (except for src, as to not interfere with Nuxt Image)
    imageSize: 'style attrs',

    // show debug messages
    debug: true,
  },

  // use layers to support nuxt image
  extends: [
    // https://github.com/davestewart/nuxt-content-assets/#nuxt-image
    'node_modules/nuxt-content-assets/cache',
  ],
})
