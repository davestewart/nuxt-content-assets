import { copyFileSync, mkdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WebSocket from 'ws'
import { findImage, getFixturePath, startDevServer, waitFor } from './utils'

describe('dev', () => {
  const rootDir = getFixturePath('content')
  const liveDir = `${rootDir}/content/live`
  const messages: any[] = []

  let server: Awaited<ReturnType<typeof startDevServer>>
  let socket: WebSocket

  const get = (path: string) => server.get(path)

  const copy = (from: string, to: string) => copyFileSync(`${rootDir}/content/${from}`, `${liveDir}/${to}`)

  const waitForMessage = (match: Record<string, any>) => waitFor(() => {
    return messages.find(message => Object.entries(match).every(([key, value]) => message[key] === value))
  })

  beforeAll(async () => {
    rmSync(liveDir, { recursive: true, force: true })
    mkdirSync(liveDir)

    // a page and image which exist before the server starts, so the page is parsed with the image's size
    copy('tags/image.png', 'resized.png')
    writeFileSync(`${liveDir}/index.md`, '![resized](resized.png)\n')

    server = await startDevServer('content')
    const { html } = server

    // connect to the module's socket server (not Nuxt Content's, which is also in the config)
    const wsUrl = html.match(/sockets:\{wsUrl:"([^"]+)"/)?.[1]
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

  it('rewrites paths', async () => {
    const html = await (await get('/paths')).text()
    expect(html).toContain('src="/paths/same.png"')
  })

  it('serves assets', async () => {
    const res = await get('/paths/same.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')
  })

  it('copies and serves added assets', async () => {
    copy('tags/image.png', 'added.png')
    await waitForMessage({ event: 'update', src: '/live/added.png' })
    expect((await get('/live/added.png')).status).toBe(200)
  })

  it('updates image sizes in the client and in parsed content', async () => {
    const getImage = async () => findImage((await (await get('/api/doc/live')).json()).body, 'resized')

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
