import { defineNuxtConfig } from 'nuxt/config'
import type { MountOptions } from '@nuxt/content'

const isStackblitz = process.env.GIT_PROXY?.includes('stackblitz')

// external source
const external = {
  driver: 'github',
  repo: 'davestewart/nuxt-content-assets',
  dir: '/playground/external',
  prefix: '/external',
}

// no external playground in stackblitz (due to CORS)
const sources: Record<string, MountOptions> = {}
if (!isStackblitz) {
  sources.ds = external
}

export default defineNuxtConfig({
  modules: [
    // make sure to add before content!
    '../src/module',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/ui',

    // make <NuxtImg> available to markdown as :nuxt-img{...}
    // (a module, so the hook runs after @nuxt/image registers the component)
    function (_options, nuxt) {
      nuxt.hook('components:extend', (components) => {
        const component = components.find(c => c.pascalName === 'NuxtImg')
        if (component) {
          component.global = true
        }
      })
    },

    // use Nuxt UI's prose components rather than the unstyled ones from Content 2 and MDC
    function (_options, nuxt) {
      nuxt.hook('components:dirs', (dirs) => {
        for (let i = dirs.length - 1; i >= 0; i--) {
          const dir = dirs[i]
          if (typeof dir === 'object') {
            if (dir.path.includes('@nuxtjs/mdc/dist/runtime/components/prose')) {
              dirs.splice(i, 1)
            }
            else if (dir.path.includes('@nuxt/content/dist/runtime/components')) {
              dir.ignore = [...dir.ignore || [], 'Prose/**']
            }
          }
        }
      })
    },
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  // light mode only
  ui: {
    colorMode: false,
  },

  // https://content.nuxtjs.org/api/configuration
  content: {
    sources,
    highlight: {
      theme: 'github-light',
      preload: ['js', 'ts', 'md', 'html'],
    },
    markdown: {
      anchorLinks: false,
      // Nuxt UI's inline code component
      tags: {
        code: 'ProseCode',
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

  compatibilityDate: '2024-08-11',
})
