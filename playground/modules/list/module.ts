import { join } from 'path'
import { defineNuxtModule } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

console.log('list module imported')

export default defineNuxtModule({
  setup (_options: any, nuxt: Nuxt) {
    nuxt.options.nitro.externals = nuxt.options.nitro.externals || {}
    nuxt.options.nitro.externals.inline = nuxt.options.nitro.externals.inline || []
    nuxt.options.nitro.externals.inline.push(join(__dirname, 'module.ts'))
    // console.log(nuxt.options.nitro.externals.inline)
    nuxt.hook('content:context', (contentContext) => {
      contentContext.transformers.push(join(__dirname, 'transformer.ts'))
      console.log('list module hook')
    })
  }
})

