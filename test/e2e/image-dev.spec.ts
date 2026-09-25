import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { findImage, getSize, startDevServer } from './utils'

// runs in development, as that's where the module's cache layer is needed for ipx to find images
describe('image dev', () => {
  let server: Awaited<ReturnType<typeof startDevServer>>

  const getDoc = async (path: string) => (await server.get(`/api/doc${path}`)).json()

  beforeAll(async () => {
    server = await startDevServer('image')
  })

  afterAll(async () => {
    await server?.close()
  })

  it('passes rewritten paths and size hints to nuxt-img', async () => {
    const html = await (await server.get('/image')).text()
    expect(html).toMatch(/<img [^>]*width="40" height="20" [^>]*src="\/_ipx\/s_40x20\/image\/photo\.png"/)
  })

  it('does not add srcset when disabled', async () => {
    const { body } = await getDoc('/image')
    expect(findImage(body, 'photo')).toEqual({ alt: 'photo', src: '/image/photo.png', width: 40, height: 20 })
  })

  it('rewrites frontmatter', async () => {
    const doc = await getDoc('/image')
    expect(doc.cover).toBe('/image/photo.png')
  })

  it('serves images through ipx', async () => {
    expect(await getSize(await server.get('/_ipx/s_40x20/image/photo.png'))).toMatchObject({ width: 40, height: 20 })
    expect(await getSize(await server.get('/_ipx/w_10/image/photo.png'))).toMatchObject({ width: 10, height: 5 })
  })
})
