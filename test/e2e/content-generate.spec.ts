import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { generateFixture } from './utils'

const routes = ['/', '/paths', '/paths/parent', '/media', '/srcset', '/frontmatter', '/ordered', '/query', '/tags']

describe('content generate', async () => {
  const { rootDir, outputDir } = await generateFixture('content', routes)

  const publicDir = `${outputDir}/public`

  const read = (path: string) => readFileSync(`${publicDir}/${path}`, 'utf8')

  it.each([
    ['paths/same.png', 'paths/same.png'],
    ['paths/sub/images/sub.png', 'paths/sub/images/sub.png'],
    ['ordered/ordered.png', '1.ordered/ordered.png'],
    ['srcset/photo@2x.png', 'srcset/photo@2x.png'],
    ['media/document.pdf', 'media/document.pdf'],
    ['media/video.mp4', 'media/video.mp4'],
  ])('copies %s', (path, source) => {
    const output = readFileSync(`${publicDir}/${path}`)
    expect(output.equals(readFileSync(`${rootDir}/content/${source}`))).toBe(true)
  })

  it.each([
    '_partials/hidden.png',
    'data/names.list',
    'data/items.json',
  ])('does not copy %s', (path) => {
    expect(existsSync(`${publicDir}/${path}`)).toBe(false)
  })

  it('renders rewritten paths and image hints', () => {
    expect(read('paths/index.html')).toContain('<img src="/paths/same.png" alt="same folder" width="40" height="30" style="aspect-ratio:40/30;">')
    expect(read('paths/parent/index.html')).toContain('src="/paths/parent.png"')
  })

  it('renders srcset', () => {
    expect(read('srcset/index.html')).toContain('srcset="/srcset/photo.png 40w, /srcset/photo@2x.png 80w, /srcset/photo@3x.png 120w"')
  })

  it('rewrites the payload used for client-side navigation', () => {
    expect(read('frontmatter/_payload.json')).toContain('/frontmatter/cover.png')
  })

  it('rewrites the content cache used for client-side queries', () => {
    const file = readdirSync(`${publicDir}/api/_content`).find(name => /^cache\..+\.json$/.test(name))
    expect(file).toBeDefined()
    const cache = read(`api/_content/${file}`)
    expect(cache).toContain('"cover":"/frontmatter/cover.png"')
    expect(cache).toContain('"src":"/paths/sub/images/sub.png"')
    expect(cache).not.toContain('"src":"sub/images/sub.png"')
  })
})
