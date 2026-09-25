import { copyFileSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { findImage, findProps, getFixturePath, startDevServer, waitFor } from './utils'

// feature tests run against the dev server, as it starts faster than a production build;
// see prod.spec.ts and content-generate.spec.ts for production and static output
describe('content', () => {
  const rootDir = getFixturePath('content')
  const liveDir = `${rootDir}/content/live`
  const messages: any[] = []

  let server: Awaited<ReturnType<typeof startDevServer>>
  let socket: WebSocket

  const get = (path: string) => server.get(path)

  const getHtml = async (path: string) => (await get(path)).text()

  const getDoc = async (path: string): Promise<Record<string, any>> => (await get(`/api/doc${path}`)).json()

  beforeAll(async () => {
    rmSync(liveDir, { recursive: true, force: true })
    mkdirSync(liveDir)

    // a page and image which exist before the server starts, so the page is parsed with the image's size
    copyFileSync(`${rootDir}/content/tags/image.png`, `${liveDir}/resized.png`)
    writeFileSync(`${liveDir}/index.md`, '![resized](resized.png)\n')

    server = await startDevServer('content')

    // connect to the module's socket server (not Nuxt Content's, which is also in the config)
    const wsUrl = server.html.match(/sockets:\{wsUrl:"([^"]+)"/)?.[1]
    expect(wsUrl).toBeDefined()
    socket = new WebSocket(wsUrl!)
    socket.on('message', (data) => {
      const message = JSON.parse(String(data))
      if (message.channel === 'content-assets') {
        messages.push(message.data)
      }
    })
    await new Promise(resolve => socket.once('open', resolve))
  })

  afterAll(async () => {
    socket?.close()
    await server?.close()
    rmSync(liveDir, { recursive: true, force: true })
  })

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
      const html = await getHtml('/paths')
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
      const res = await get(url)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain(type)
      const source = readFileSync(`${rootDir}/content/${file}`)
      expect(Buffer.from(await res.arrayBuffer()).equals(source)).toBe(true)
    })

    it.each([
      ['partials', '/_partials/hidden.png'],
      ['content files', '/data/names.list'],
    ])('does not serve %s', async (_, url) => {
      const res = await get(url)
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
      const html = await getHtml('/tags')
      expect(html).toMatch(/<img src="\/tags\/image\.png" class="custom-image">/)
    })

    it('does not rewrite code', async () => {
      const { body } = await getDoc('/tags')
      const code = JSON.stringify(findProps(body, 'pre'))
      expect(code).not.toContain('/tags/image.png')
      const html = await getHtml('/tags')
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
      const html = await getHtml('/srcset')
      expect(html).toMatch(/<img [^>]*alt="explicit"[^>]*srcset="custom\.png 1x"/)
      expect(html).not.toMatch(/<img [^>]*alt="explicit"[^>]*photo@2x/)
    })
  })

  describe('content extensions', () => {
    it('does not treat content files as assets', async () => {
      expect((await get('/data/items.json')).status).toBe(404)
      expect((await get('/data/names.list')).status).toBe(404)
    })

    it('treats other files as assets', async () => {
      expect((await get('/media/notes.txt')).status).toBe(200)
    })
  })

  describe('live reload', () => {
    const copy = (from: string, to: string) => copyFileSync(`${rootDir}/content/${from}`, `${liveDir}/${to}`)

    const waitForMessage = (match: Record<string, any>) => waitFor(() => {
      return messages.find(message => Object.entries(match).every(([key, value]) => message[key] === value))
    })

    it('copies and serves added assets', async () => {
      copy('tags/image.png', 'added.png')
      await waitForMessage({ event: 'update', src: '/live/added.png' })
      expect((await get('/live/added.png')).status).toBe(200)
    })

    it('updates image sizes in the client and in parsed content', async () => {
      const getImage = async () => findImage((await getDoc('/live')).body, 'resized')

      expect(await getImage()).toMatchObject({ width: 16, height: 16 })

      // resize image
      copy('paths/same.png', 'resized.png')
      expect(await waitForMessage({ event: 'update', src: '/live/resized.png' })).toMatchObject({ width: 40, height: 30 })
      await waitFor(async () => (await getImage())?.width === 40)
      expect(await getImage()).toMatchObject({ width: 40, height: 30, style: { aspectRatio: '40/30' } })
    })

    it('removes deleted assets', async () => {
      copy('tags/image.png', 'removed.png')
      await waitForMessage({ event: 'update', src: '/live/removed.png' })
      unlinkSync(`${liveDir}/removed.png`)
      await waitForMessage({ event: 'remove', src: '/live/removed.png' })
      expect((await get('/live/removed.png')).status).toBe(404)
    })

    it('does not copy content files', async () => {
      copy('index.md', 'page.md')
      // give the watcher time to (not) act
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(messages.find(message => message.src === '/live/page.md')).toBeUndefined()
    })
  })
})
