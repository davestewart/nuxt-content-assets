import { describe, expect, it } from 'vitest'
import { $fetch, fetch } from '@nuxt/test-utils/e2e'
import { getSize, setupFixture } from './utils'

// a single smoke test of a production build; features are tested in dev and generate
describe('prod', async () => {
  await setupFixture('image')

  it('renders rewritten paths and serves assets and ipx images', async () => {
    const html = await $fetch<string>('/image')
    expect(html).toContain('src="/_ipx/s_40x20/image/photo.png"')
    expect(await getSize(await fetch('/image/photo.png'))).toMatchObject({ width: 40, height: 20 })
    expect(await getSize(await fetch('/_ipx/w_10/image/photo.png'))).toMatchObject({ width: 10, height: 5 })
  })
})
