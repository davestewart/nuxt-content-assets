import contentAssets from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    contentAssets,
    '@nuxt/content',
  ],

  contentAssets: {
    imageSize: 'style attrs',
    contentExtensions: 'mdx? csv ya?ml json list',
  },

  content: {
    experimental: {
      // use node's built-in sqlite, so tests don't need better-sqlite3
      sqliteConnector: 'native',
    },
  },

  compatibilityDate: '2026-09-01',
})
