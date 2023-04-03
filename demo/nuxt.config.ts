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
    // content-relative assets folder
    output: 'content/[hash].[ext]',

    // add html to supported types
    additionalExtensions: 'html',

    // add aspect-ratio data to images
    aspect: 'style data',

    // show debug messages
    debug: true,
  },
})
