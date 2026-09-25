import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    // make sure to add before content!
    '../src/module',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/ui',

    // make <NuxtImg> available to markdown as :nuxt-img{...}
    // (a module, so the hook runs after @nuxt/image registers the component)
    function (_options, nuxt) {
      nuxt.hook('components:extend', (components) => {
        const component = components.find(c => c.pascalName === 'NuxtImg')
        if (component) {
          component.global = true
        }
      })
    },
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  // light mode only
  ui: {
    colorMode: false,
  },

  // https://content.nuxt.com/docs/getting-started/configuration
  content: {
    experimental: {
      // use node's built-in sqlite, so the playground doesn't need better-sqlite3
      sqliteConnector: 'native',
    },
    build: {
      markdown: {
        highlight: {
          theme: 'github-light',
          langs: ['js', 'ts', 'md', 'html'],
        },
      },
    },
    renderer: {
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

  compatibilityDate: '2026-09-01',
})
