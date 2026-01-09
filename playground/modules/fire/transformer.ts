import { defineTransformer } from '@nuxt/content/transformers/utils'
import { createMarkdownParser } from '@nuxtjs/mdc/runtime'
import { walk } from '../../../src/runtime/utils'

let parser: ReturnType<typeof createMarkdownParser>

console.log('custom transformer imported')

export default defineTransformer({
  name: 'custom-transformer',
  extensions: ['.fire'],
  async parse (_id, rawContent) {
    console.log('Parsing custom content', _id)

    if (!parser) {
      parser = await createMarkdownParser()
    }

    const file = await parser(rawContent)
    walk(file.body, (value, parent, key) => {
      if (parent.type === 'text' && key === 'value' && typeof value === 'string') {
        parent[key] = '🔥 ' + value
      }
    })

    return {
      _id,
      ...file.data,
      body: file.body,
    }
  },
})
