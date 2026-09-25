import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { findImage, findProps, getDoc } from './utils'

const rootDir = fileURLToPath(new URL('../fixtures/content', import.meta.url))

describe('content', async () => {
  await setup({ rootDir })

  describe('paths', () => {
    it('rewrites images in the same folder', async () => {
      const { body } = await getDoc('/paths')
      expect(findImage(body, 'same folder')?.src).toBe('/paths/same.png')
    })

    it('rewrites images in a sub folder', async () => {
      const { body } = await getDoc('/paths')
      expect(findImage(body, 'sub folder')?.src).toBe('/paths/sub/images/sub.png')
    })

    it('rewrites images in a parent folder', async () => {
      const { body } = await getDoc('/paths/parent')
      expect(findImage(body, 'parent folder')?.src).toBe('/paths/parent.png')
    })

    it('leaves absolute paths, remote urls and missing assets alone', async () => {
      const { body } = await getDoc('/paths')
      expect(findImage(body, 'absolute')?.src).toBe('/paths/same.png')
      expect(findImage(body, 'remote')?.src).toBe('https://example.com/remote.png')
      expect(findImage(body, 'missing')?.src).toBe('missing.png')
    })

    it('strips numeric ordering from paths', async () => {
      const { body } = await getDoc('/ordered')
      expect(findImage(body, 'ordered')?.src).toBe('/ordered/ordered.png')
    })

    it('preserves query strings', async () => {
      const { body } = await getDoc('/query')
      expect(findImage(body, 'query')?.src).toBe('/query/image.png?foo=bar')
    })

    it('renders rewritten paths in the page', async () => {
      const html = await $fetch<string>('/paths')
      expect(html).toContain('src="/paths/same.png"')
      expect(html).toContain('src="/paths/sub/images/sub.png"')
    })
  })

  describe('serving', () => {
    it.each([
      ['/paths/same.png', 'image/png', 'paths/same.png'],
      ['/paths/sub/images/sub.png', 'image/png', 'paths/sub/images/sub.png'],
      ['/ordered/ordered.png', 'image/png', '1.ordered/ordered.png'],
      ['/media/document.pdf', 'application/pdf', 'media/document.pdf'],
      ['/media/video.mp4', 'video/mp4', 'media/video.mp4'],
    ])('serves %s', async (url, type, file) => {
      const res = await fetch(url)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain(type)
      const source = readFileSync(`${rootDir}/content/${file}`)
      expect(Buffer.from(await res.arrayBuffer()).equals(source)).toBe(true)
    })

    it.each([
      ['partials', '/_partials/hidden.png'],
      ['content files', '/data/names.list'],
    ])('does not serve %s', async (_, url) => {
      const res = await fetch(url)
      expect(res.status).toBe(404)
    })
  })

  describe('tags', () => {
    it('rewrites links, and opens them in a new tab', async () => {
      const { body } = await getDoc('/media')
      const links = findProps(body, 'a')
      expect(links).toContainEqual({ href: '/media/document.pdf', target: '_blank' })
    })

    it('keeps an authored link target', async () => {
      const { body } = await getDoc('/media')
      const links = findProps(body, 'a')
      expect(links).toContainEqual({ href: '/media/notes.txt', target: '_self' })
    })

    it('rewrites any tag', async () => {
      const { body } = await getDoc('/media')
      expect(findProps(body, 'video')[0].src).toBe('/media/video.mp4')
      expect(findProps(body, 'iframe')[0].src).toBe('/media/document.pdf')
    })

    it('rewrites html and nested tags', async () => {
      const { body } = await getDoc('/tags')
      expect(findImage(body, 'html')?.src).toBe('/tags/image.png')
      expect(findImage(body, 'nested')?.src).toBe('/tags/image.png')
    })

    it('rewrites component props', async () => {
      const html = await $fetch<string>('/tags')
      expect(html).toMatch(/<img src="\/tags\/image\.png" class="custom-image">/)
    })

    it('does not rewrite code', async () => {
      const { body } = await getDoc('/tags')
      const code = JSON.stringify(findProps(body, 'pre'))
      expect(code).not.toContain('/tags/image.png')
      const html = await $fetch<string>('/tags')
      expect(html).toMatch(/<code[^>]*><!--\[-->image\.png<!--\]--><\/code>/)
    })
  })

  describe('frontmatter', () => {
    it('rewrites top-level properties', async () => {
      const doc = await getDoc('/frontmatter')
      expect(doc.cover).toBe('/frontmatter/cover.png')
    })

    it('rewrites nested properties', async () => {
      const doc = await getDoc('/frontmatter')
      expect(doc.gallery).toEqual(['/frontmatter/cover.png', { image: '/paths/same.png' }])
    })

    it('leaves remote urls alone', async () => {
      const doc = await getDoc('/frontmatter')
      expect(doc.link).toBe('https://example.com/cover.png')
    })
  })

  describe('image size', () => {
    it('adds width and height attributes', async () => {
      const { body } = await getDoc('/paths')
      const image = findImage(body, 'same folder')
      expect(image?.width).toBe(40)
      expect(image?.height).toBe(30)
    })

    it('adds aspect-ratio style', async () => {
      const { body } = await getDoc('/paths')
      expect(findImage(body, 'sub folder')?.style).toEqual({ aspectRatio: '50/25' })
    })

    it('does not size non-images', async () => {
      const { body } = await getDoc('/media')
      expect(findProps(body, 'video')[0]).toEqual({ src: '/media/video.mp4' })
    })
  })

  describe('srcset', () => {
    it('adds srcset and sizes when scaled variants exist', async () => {
      const { body } = await getDoc('/srcset')
      const image = findImage(body, 'photo')
      expect(image?.srcset).toBe('/srcset/photo.png 40w, /srcset/photo@2x.png 80w, /srcset/photo@3x.png 120w')
      expect(image?.sizes).toBe('(max-width: 40px) 100vw, 40px')
    })

    it('does not add srcset when there are no variants', async () => {
      const { body } = await getDoc('/paths')
      expect(findImage(body, 'same folder')?.srcset).toBeUndefined()
    })

    it('keeps an authored srcset', async () => {
      const html = await $fetch<string>('/srcset')
      expect(html).toMatch(/<img [^>]*alt="explicit"[^>]*srcset="custom\.png 1x"/)
      expect(html).not.toMatch(/<img [^>]*alt="explicit"[^>]*photo@2x/)
    })
  })

  describe('content extensions', () => {
    it('does not treat content files as assets', async () => {
      expect((await fetch('/data/items.json')).status).toBe(404)
      expect((await fetch('/data/names.list')).status).toBe(404)
    })

    it('treats other files as assets', async () => {
      expect((await fetch('/media/notes.txt')).status).toBe(200)
    })
  })
})
