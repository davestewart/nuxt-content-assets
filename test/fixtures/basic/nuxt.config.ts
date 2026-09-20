import { defineNuxtConfig } from 'nuxt/config'
import contentAssets from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    contentAssets,
    '@nuxt/content',
  ],
  contentAssets: {
    imageSize: 'attrs style',
  },
  content: {
    experimental: {
      // use node's built-in sqlite so tests don't need better-sqlite3
      sqliteConnector: 'native',
    },
  },
  compatibilityDate: '2025-01-01',
})
