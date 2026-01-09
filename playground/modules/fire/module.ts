import { join } from 'path'
import { defineNuxtModule } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

console.log('custom module imported')

// @see https://github.com/davestewart/nuxt-content-assets/issues/81
export default defineNuxtModule({
  setup (_options: any, nuxt: Nuxt) {
    nuxt.options.nitro.externals = nuxt.options.nitro.externals || {}
    nuxt.options.nitro.externals.inline = nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push(join(__dirname, 'module'))
    nuxt.hook('content:context', (contentContext) => {
      contentContext.transformers.push(join(__dirname, 'transformer.ts'))
      console.log('custom module hook')
    })
  },
})
