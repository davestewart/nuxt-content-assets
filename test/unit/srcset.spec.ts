import { describe, expect, it } from 'vitest'
import { getSrcset, getVariantPath, resolveSrcsetOptions } from '../../src/runtime/utils'

const options = resolveSrcsetOptions(true) as Exclude<ReturnType<typeof resolveSrcsetOptions>, false>

type Entry = { srcAttr: string, width?: number }

const makeLookup = (index: Record<string, Entry>) => (path: string) => index[path]

describe('srcset', () => {
  it('should resolve options', () => {
    expect(resolveSrcsetOptions(false)).toBe(false)
    expect(resolveSrcsetOptions(undefined)).toMatchObject({ scales: [2, 3] })
    expect(resolveSrcsetOptions({ scales: [1, 2, 4] })).toMatchObject({ scales: [2, 4] })
    expect(resolveSrcsetOptions({ sizes: false })).toMatchObject({ sizes: false })
  })

  it('should build variant paths', () => {
    expect(getVariantPath('posts/image.png', 2, options.pattern)).toBe('posts/image@2x.png')
    expect(getVariantPath('image.png', 3, options.pattern)).toBe('image@3x.png')
    expect(getVariantPath('/abs/a/image.jpg', 2, '{name}-{scale}x.{ext}')).toBe('/abs/a/image-2x.jpg')
  })

  it('should build srcset and sizes when variants exist', () => {
    const index: Record<string, Entry> = {
      '/c/posts/image.png': { srcAttr: '/posts/image.png', width: 480 },
      '/c/posts/image@2x.png': { srcAttr: '/posts/image@2x.png', width: 960 },
      '/c/posts/image@3x.png': { srcAttr: '/posts/image@3x.png' },
    }
    expect(getSrcset('/c/posts/image.png', index['/c/posts/image.png'], makeLookup(index), options)).toEqual({
      srcset: '/posts/image.png 480w, /posts/image@2x.png 960w, /posts/image@3x.png 1440w',
      sizes: '(max-width: 480px) 100vw, 480px',
    })
  })

  it('should return nothing when there are no variants or no width', () => {
    const index: Record<string, Entry> = {
      '/c/image.png': { srcAttr: '/image.png', width: 480 },
      '/c/other.png': { srcAttr: '/other.png' },
      '/c/other@2x.png': { srcAttr: '/other@2x.png' },
    }
    expect(getSrcset('/c/image.png', index['/c/image.png'], makeLookup(index), options)).toBeUndefined()
    expect(getSrcset('/c/other.png', index['/c/other.png'], makeLookup(index), options)).toBeUndefined()
  })
})
