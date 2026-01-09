import { defineTransformer } from '@nuxt/content/transformers'

console.log('list transformer imported')

// @see https://v2.content.nuxt.com/recipes/transformers
export default defineTransformer({
  name: 'list-transformer',
  extensions: ['.list'],
  // @ts-expect-error invalid return type
  parse (_id: string, rawContent: string) {
    console.log('Parsing list content', _id)
    return {
      _id,
      body: rawContent
        .trim()
        .split('\n')
        .map(line => line.trim())
        .sort()
    }
  }
})
