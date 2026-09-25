import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: '**/*.md',
      // `gallery` is left out, so it's stored in `meta`
      schema: z.object({
        cover: z.string().optional(),
        link: z.string().optional(),
      }),
    }),
  },
})
