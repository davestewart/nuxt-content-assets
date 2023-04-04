export default defineNuxtConfig({
  app: {
    head: {
      link: [
        { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Dosis:wght@600;700&display=swap' },
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
    // place all assets in a single folder
    output: 'assets/content/[name]-[hash].[ext]',

    // serve html files to be shown in iframes
    additionalExtensions: 'html',

    // add image size hints
    imageSize: 'attrs url',

    // show debug messages
    debug: true,
  },
})

