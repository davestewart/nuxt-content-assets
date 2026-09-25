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

  compatibilityDate: '2024-08-11',
})
