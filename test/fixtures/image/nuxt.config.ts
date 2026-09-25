import contentAssets from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    contentAssets,
    '@nuxt/content',
    '@nuxt/image',
  ],

  // non-default options, to check they are respected
  contentAssets: {
    imageSize: 'attrs',
    srcset: false,
  },

  content: {
    experimental: {
      // use node's built-in sqlite, so tests don't need better-sqlite3
      sqliteConnector: 'native',
    },
  },

  compatibilityDate: '2026-09-01',
})
