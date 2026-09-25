import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'

// the module should not break an app that has no content
describe('basic', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  })

  it('renders the index page', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('<div>basic</div>')
  })
})
