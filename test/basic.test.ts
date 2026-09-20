import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, fetch } from '@nuxt/test-utils'

describe('nuxt content 3', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
  })

  it('rewrites relative asset paths in the body', async () => {
    const html = await $fetch<string>('/')
    // image with size hints
    expect(html).toMatch(/<img[^>]*src="\/posts\/media\/image\.png"[^>]*width="100"[^>]*height="100"/)
    // image with srcset from @2x variant
    expect(html).toMatch(/srcset="\/posts\/photo\.jpg 400w, \/posts\/photo@2x\.jpg 1280w"/)
    // image inside a heading
    expect(html).toMatch(/<h2[^>]*>(?:(?!<\/h2>).)*src="\/posts\/media\/image\.png"/)
    // link opens in new window
    expect(html).toMatch(/<a[^>]*href="\/posts\/media\/image\.png"[^>]*target="_blank"/)
  })

  it('rewrites relative asset paths in frontmatter', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('&quot;cover&quot;:&quot;/posts/media/image.png&quot;')
    expect(html).toContain('&quot;gallery&quot;:[&quot;/posts/photo.jpg&quot;,&quot;https://example.com/remote.jpg&quot;]')
  })

  it('serves the copied assets', async () => {
    const res = await fetch('/posts/media/image.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')
  })
})
