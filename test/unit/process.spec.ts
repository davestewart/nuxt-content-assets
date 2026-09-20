import { describe, expect, it } from 'vitest'
import { makeAssetIndex } from '../../src/build/assets'
import { processContent } from '../../src/build/process'
import { resolveSrcsetOptions } from '../../src/runtime/utils'

/**
 * Index with fake entries (bypasses the filesystem)
 */
function makeIndex () {
  const index = makeAssetIndex('/public', resolveSrcsetOptions(true))
  const fake = (absSrc: string, srcAttr: string, width?: number, height?: number) => {
    ;(index as any).__set ||= index.set
    // use resolve's internal map via a real set on a non-image path, then patch
    const asset = index.set(absSrc, '/public' + srcAttr)
    Object.assign(asset, { width, height })
  }
  fake('/c/posts/image.png', '/posts/image.png', 400, 300)
  fake('/c/posts/image@2x.png', '/posts/image@2x.png', 800, 600)
  fake('/c/posts/file.pdf', '/posts/file.pdf')
  fake('/c/posts/media/video.mp4', '/posts/media/video.mp4')
  return index
}

function makeContent () {
  return {
    id: 'content/posts/index.md',
    path: '/posts',
    title: 'Post',
    image: 'image.png',
    meta: { gallery: ['image.png', 'missing.png', 'https://example.com/x.png'], count: 1 },
    body: {
      type: 'minimark',
      value: [
        ['p', {}, ['img', { src: 'image.png', alt: 'Alt text' }]],
        ['p', {}, ['img', { src: './image.png?x=1', style: 'color: red' }]],
        ['p', {}, ['a', { href: 'file.pdf' }, 'PDF']],
        ['video', { src: 'media/video.mp4' }],
        ['img', { src: '/absolute.png' }],
        ['img', { src: 'nope.png' }],
      ],
    },
  }
}

describe('process', () => {
  it('should rewrite meta and body paths with size hints', () => {
    const content = makeContent()
    const updated = processContent('/c/posts/index.md', content, makeIndex(), ['attrs', 'style', 'src'])

    // meta
    expect(content.image).toBe('/posts/image.png?width=400&height=300')
    expect(content.meta.gallery).toEqual(['/posts/image.png?width=400&height=300', 'missing.png', 'https://example.com/x.png'])
    expect(content.meta.count).toBe(1)

    // body
    const [p1, p2, p3, video, abs, nope] = content.body.value as any[]
    expect(p1[2][1]).toEqual({
      src: '/posts/image.png',
      alt: 'Alt text',
      width: 400,
      height: 300,
      style: { aspectRatio: '400/300' },
      srcset: '/posts/image.png 400w, /posts/image@2x.png 800w',
      sizes: '(max-width: 400px) 100vw, 400px',
    })
    expect(p2[2][1].src).toBe('/posts/image.png?x=1')
    expect(p2[2][1].style).toBe('color: red; aspect-ratio: 400/300;')
    expect(p3[2][1]).toEqual({ href: '/posts/file.pdf', target: '_blank' })
    expect(video[1]).toEqual({ src: '/posts/media/video.mp4' })
    expect(abs[1]).toEqual({ src: '/absolute.png' })
    expect(nope[1]).toEqual({ src: 'nope.png' })

    expect(updated.length).toBe(6)
  })

  it('should not add hints when not configured', () => {
    const content = makeContent()
    processContent('/c/posts/index.md', content, makeIndex(), [])
    const img = (content.body.value[0] as any)[2][1]
    expect(img).toEqual({
      src: '/posts/image.png',
      alt: 'Alt text',
      srcset: '/posts/image.png 400w, /posts/image@2x.png 800w',
      sizes: '(max-width: 400px) 100vw, 400px',
    })
    expect(content.image).toBe('/posts/image.png')
  })

  it('should not add srcset when disabled', () => {
    const index = makeAssetIndex('/public', false)
    index.set('/c/a.txt', '/public/a.txt')
    const content = { body: { type: 'minimark', value: [['a', { href: 'a.txt' }]] } }
    processContent('/c/index.md', content, index, [])
    expect((content.body.value[0] as any)[1]).toEqual({ href: '/a.txt', target: '_blank' })
  })
})
