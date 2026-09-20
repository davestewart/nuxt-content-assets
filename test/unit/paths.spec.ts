import { afterEach, describe, expect, it } from 'vitest'
import { isAsset, isRelative, isValidAsset, setContentExtensions } from '../../src/runtime/utils'

describe('paths', () => {
  afterEach(() => {
    setContentExtensions()
  })

  it('should detect relative paths', () => {
    expect(isRelative('image.jpg')).toBe(true)
    expect(isRelative('../image.jpg')).toBe(true)
    expect(isRelative('media/image.jpg?width=100')).toBe(true)
    expect(isRelative('/image.jpg')).toBe(false)
    expect(isRelative('//cdn.example.com/image.jpg')).toBe(false)
    expect(isRelative('https://example.com/image.jpg')).toBe(false)
    expect(isRelative('mailto:someone@example.com')).toBe(false)
    expect(isRelative('data:image/png;base64,AAAA')).toBe(false)
    expect(isRelative('#anchor')).toBe(false)
  })

  it('should detect assets using default content extensions', () => {
    expect(isAsset('image.jpg')).toBe(true)
    expect(isAsset('docs/file.pdf')).toBe(true)
    expect(isAsset('image.JPG?x=1')).toBe(true)
    expect(isAsset('article.md')).toBe(false)
    expect(isAsset('article.mdx')).toBe(false)
    expect(isAsset('data.yml')).toBe(false)
    expect(isAsset('data.yaml')).toBe(false)
    expect(isAsset('data.json')).toBe(false)
    expect(isAsset('data.csv')).toBe(false)
    // no extension is not an asset
    expect(isAsset('Hello world')).toBe(false)
    expect(isAsset('folder/')).toBe(false)
  })

  it('should respect configured content extensions', () => {
    expect(isAsset('article.fire')).toBe(true)
    setContentExtensions('mdx? fire')
    expect(isAsset('article.fire')).toBe(false)
    expect(isAsset('data.json')).toBe(true)
  })

  it('should validate relative assets', () => {
    expect(isValidAsset('image.jpg')).toBe(true)
    expect(isValidAsset('/image.jpg')).toBe(false)
    expect(isValidAsset('article.md')).toBe(false)
    expect(isValidAsset('Some alt text')).toBe(false)
    expect(isValidAsset(123)).toBe(false)
    expect(isValidAsset(undefined)).toBe(false)
  })
})
