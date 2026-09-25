import { describe, expect, it } from 'vitest'
import { getSrcset, getVariantKey, resolveSrcsetOptions } from '../../src/runtime/utils'
import type { AssetIndex } from '../../src/types'

const options = resolveSrcsetOptions(true) as Exclude<ReturnType<typeof resolveSrcsetOptions>, false>

describe('srcset', () => {
  it('should resolve options', () => {
    expect(resolveSrcsetOptions(false)).toBe(false)
    expect(resolveSrcsetOptions(undefined)).toMatchObject({ scales: [2, 3] })
    expect(resolveSrcsetOptions({ scales: [1, 2, 4] })).toMatchObject({ scales: [2, 4] })
    expect(resolveSrcsetOptions({ sizes: false })).toMatchObject({ sizes: false })
  })

  it('should build variant keys', () => {
    expect(getVariantKey('posts/image.png', 2, options.pattern)).toBe('posts/image@2x.png')
    expect(getVariantKey('image.png', 3, options.pattern)).toBe('image@3x.png')
    expect(getVariantKey('a/b/image.jpg', 2, '{name}-{scale}x.{ext}')).toBe('a/b/image-2x.jpg')
  })

  it('should build srcset and sizes when variants exist', () => {
    const index: AssetIndex = {
      'posts/image.png': { srcAttr: '/posts/image.png', width: 480, height: 300 },
      'posts/image@2x.png': { srcAttr: '/posts/image@2x.png', width: 960, height: 600 },
      'posts/image@3x.png': { srcAttr: '/posts/image@3x.png' },
    }
    expect(getSrcset('posts/image.png', index['posts/image.png'], index, options)).toEqual({
      srcset: '/posts/image.png 480w, /posts/image@2x.png 960w, /posts/image@3x.png 1440w',
      sizes: '(max-width: 480px) 100vw, 480px',
    })
  })

  it('should return nothing when there are no variants or no width', () => {
    const index: AssetIndex = {
      'image.png': { srcAttr: '/image.png', width: 480, height: 300 },
      'other.png': { srcAttr: '/other.png' },
      'other@2x.png': { srcAttr: '/other@2x.png' },
    }
    expect(getSrcset('image.png', index['image.png'], index, options)).toBeUndefined()
    expect(getSrcset('other.png', index['other.png'], index, options)).toBeUndefined()
  })
})
