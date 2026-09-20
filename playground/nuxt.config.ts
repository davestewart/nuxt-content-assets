import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@600;700&display=swap' },
      ],
    },
  },

  modules: [
    // make sure to add before content!
    '../src/module',
    '@nuxt/content',
    '@nuxt/image',
  ],

  // https://content.nuxt.com/docs/getting-started/configuration
  content: {
    experimental: {
      // use node's built-in sqlite (node 22+) so the playground doesn't need better-sqlite3
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
  },

  // https://github.com/davestewart/nuxt-content-assets/#configuration
  contentAssets: {
    // add image size hints (except for src, as to not interfere with Nuxt Image)
    imageSize: 'style attrs',

    // show debug messages
    debug: true,
  },

  // make <NuxtImg> available to markdown as :nuxt-img{...}
  hooks: {
    'components:extend' (components) {
      const component = components.find(c => c.pascalName === 'NuxtImg')
      if (component) {
        component.global = true
      }
    },
  },

  // the playground deliberately includes invalid and query-string image paths, which IPX can't prerender
  nitro: {
    prerender: {
      failOnError: false,
    },
  },

  compatibilityDate: '2025-01-01',
})
