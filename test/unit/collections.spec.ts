import { describe, expect, it } from 'vitest'
import { getGitSourceDir, parseSourceBase, resolveSource } from '../../src/build/collections'

describe('collections', () => {
  it('should parse source bases', () => {
    expect(parseSourceBase('**')).toEqual({ fixed: '' })
    expect(parseSourceBase('**/*.md')).toEqual({ fixed: '' })
    expect(parseSourceBase('blog/**')).toEqual({ fixed: 'blog/' })
    expect(parseSourceBase('docs/en/**/*.md')).toEqual({ fixed: 'docs/en/' })
  })

  it('should resolve local sources', () => {
    expect(resolveSource('**', '/root')).toEqual({
      dir: '/root/content',
      prefix: '',
      exclude: [],
      remote: false,
    })
    expect(resolveSource({ include: 'blog/**', exclude: ['**/drafts/**'] }, '/root')).toEqual({
      dir: '/root/content/blog',
      prefix: '/blog',
      exclude: ['**/drafts/**'],
      remote: false,
    })
    expect(resolveSource({ include: 'docs/**', prefix: '/guide' }, '/root')).toMatchObject({
      dir: '/root/content/docs',
      prefix: '/guide',
    })
    expect(resolveSource({ include: '**', cwd: '/elsewhere/content' }, '/root')).toMatchObject({
      dir: '/elsewhere/content',
    })
    expect(resolveSource({ include: '**', cwd: '~~/packages/docs/content' }, '/root')).toMatchObject({
      dir: '/root/packages/docs/content',
    })
    expect(resolveSource({ include: './blog/**' }, '/root')).toMatchObject({
      dir: '/root/content/blog',
      prefix: '/blog',
    })
  })

  it('should resolve git source folders like nuxt content', () => {
    expect(getGitSourceDir('https://github.com/nuxt/content', '/root'))
      .toBe('/root/.data/content/github.com-nuxt-content-main')
    expect(getGitSourceDir({ url: 'https://github.com/nuxt/content.git', branch: 'v2' }, '/root'))
      .toBe('/root/.data/content/github.com-nuxt-content-v2')
    expect(getGitSourceDir({ url: 'https://github.com/nuxt/content', tag: 'v3.0.0' }, '/root'))
      .toBe('/root/.data/content/github.com-nuxt-content-tag-v3.0.0')
    expect(getGitSourceDir('https://github.com/nuxt/content/tree/dev', '/root'))
      .toBe('/root/.data/content/github.com-nuxt-content-dev')
    expect(getGitSourceDir('not a url', '/root')).toBeUndefined()
  })

  it('should resolve remote sources', () => {
    expect(resolveSource({ include: 'docs/**', repository: 'https://github.com/nuxt/content' }, '/root')).toEqual({
      dir: '/root/.data/content/github.com-nuxt-content-main/docs',
      prefix: '/docs',
      exclude: [],
      remote: true,
    })
  })
})
