export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css' }
      ]
    },
  },

  modules: [
    '../src/module',
    '@nuxt/content',
  ],

  // https://content.nuxtjs.org/api/configuration
  content: {
    documentDriven: true,
    markdown: {
      anchorLinks: false,
    }
  },

  'content-assets': {
    // use a content-relative assets path
    output: 'content/[folder]/[file]',

    // enable html files to be served
    additionalExtensions: 'html',

    // add image size hints
    imageSize: 'attrs',

    // show debug messages
    debug: true,
  },
})
