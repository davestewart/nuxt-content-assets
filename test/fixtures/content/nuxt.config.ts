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

  compatibilityDate: '2024-08-11',
})
