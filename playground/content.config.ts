import { defineCollection, defineContentConfig, z } from '@nuxt/content'

// no external source in stackblitz (due to CORS)
const isStackblitz = process.env.GIT_PROXY?.includes('stackblitz')

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: 'page',
      source: [
        // local content
        { include: '**/*.md' },

        // external content, cloned from github by nuxt content
        ...(isStackblitz
          ? []
          : [{
              repository: 'https://github.com/davestewart/nuxt-content-assets',
              include: 'playground/external/**/*.md',
              prefix: '/external',
            }]),
      ],
      // frontmatter used by the frontmatter page (fields outside the schema are stored in `meta`)
      schema: z.object({
        image: z.string().optional(),
        recipes: z.array(z.object({
          title: z.string(),
          image: z.string(),
        })).optional(),
      }),
    }),
  },
})
