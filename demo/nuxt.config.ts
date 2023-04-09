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
    markdown: {
      anchorLinks: false,
    },

    sources: {
      // disabled for online demo
      // ds: {
      //   driver: 'github',
      //   repo: 'davestewart/nuxt-content-assets',
      //   dir: '/demo/external',
      //   prefix: '/external'
      // },
    },
  },

  'content-assets': {
    // serve assets using sub-folder structure
    output: '/assets/[folder]/[file]',

    // serve html files to be shown in iframes
    additionalExtensions: 'html',

    // add image size hints
    imageSize: 'attrs url',

    // show debug messages
    debug: true,
  },
})

