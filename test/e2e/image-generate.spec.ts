import { readFileSync } from 'node:fs'
import { imageSize } from 'image-size'
import { describe, expect, it } from 'vitest'
import { generateFixture } from './utils'

describe('image generate', async () => {
  const { rootDir, outputDir } = await generateFixture('image', ['/', '/image'])

  const publicDir = `${outputDir}/public`

  it('copies assets', () => {
    const output = readFileSync(`${publicDir}/image/photo.png`)
    expect(output.equals(readFileSync(`${rootDir}/content/image/photo.png`))).toBe(true)
  })

  it('passes rewritten paths and size hints to nuxt-img', () => {
    const html = readFileSync(`${publicDir}/image/index.html`, 'utf8')
    expect(html).toMatch(/<img [^>]*width="40" height="20" [^>]*src="\/_ipx\/s_40x20\/image\/photo\.png"/)
  })

  // note: ipx doesn't enlarge, so the 2x variant is the same size as the 40x20 source
  it.each([
    's_40x20',
    's_80x40',
  ])('prerenders ipx images (%s)', (modifiers) => {
    const image = readFileSync(`${publicDir}/_ipx/${modifiers}/image/photo.png`)
    expect(imageSize(new Uint8Array(image))).toMatchObject({ width: 40, height: 20 })
  })
})
