import * as Fs from 'node:fs'
import * as Os from 'node:os'
import Path from 'node:path'
import { describe, expect, it } from 'vitest'
import { rewriteContent } from '../../src/runtime/content/parsed'

function el (tag: string, props: Record<string, any> = {}, children: any[] = []) {
  return { type: 'element', tag, props, children }
}

describe('parsed', () => {
  it('should rewrite image sizes in a cached document', () => {
    const dir = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'nca-'))
    const path = Path.join(dir, 'index.md')
    Fs.writeFileSync(path, JSON.stringify({
      hash: 'abc',
      parsed: {
        _id: 'content:index.md',
        title: 'Title',
        count: 3,
        image: '/image.jpg?width=100&height=50',
        body: {
          type: 'root',
          children: [
            el('img', {
              src: '/image.jpg?width=100&height=50',
              width: 100,
              height: 50,
              style: 'aspect-ratio: 100/50',
              srcset: '/image.jpg 100w, /image@2x.jpg 200w',
              sizes: '(max-width: 100px) 100vw, 100px',
            }),
            el('img', { src: '/other.jpg', width: 1, height: 1 }),
          ],
        },
      },
    }))

    const result = rewriteContent(path, { srcAttr: '/image.jpg', width: 200, height: 100 })!
    const [img, other] = result.body.children

    expect(result.image).toBe('/image.jpg?width=200&height=100')
    expect(result.count).toBe(3)
    expect(img.props.src).toMatch(/^\/image\.jpg\?width=200&height=100&time=\d+$/)
    expect(img.props.width).toBe(200)
    expect(img.props.height).toBe(100)
    expect(img.props.style).toBe('aspect-ratio: 200/100')
    expect(img.props.srcset).toBe('/image.jpg 200w, /image@2x.jpg 200w')
    expect(img.props.sizes).toBe('(max-width: 200px) 100vw, 200px')
    expect(other.props.width).toBe(1)

    const saved = JSON.parse(Fs.readFileSync(path, 'utf8'))
    expect(saved.hash).toBe('abc')
    expect(saved.parsed.body.children[0].props.width).toBe(200)

    Fs.rmSync(dir, { recursive: true, force: true })
  })

  it('should ignore missing files', () => {
    expect(rewriteContent('/nope/nothing.md', { srcAttr: '/x.jpg' })).toBeUndefined()
  })
})
