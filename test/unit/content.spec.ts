import { describe, expect, it } from 'vitest'
import { walkBody, walkMeta } from '../../src/runtime/utils'
import type { ParsedContent } from '../../src/types'

function el (tag: string, props: Record<string, any> = {}, children: any[] = []) {
  return { type: 'element', tag, props, children }
}

const doc = {
  _id: 'content:index.md',
  _file: 'index.md',
  title: 'Title',
  image: 'image.jpg',
  images: ['a.jpg', 'b.jpg'],
  excerpt: { type: 'root', children: [el('img', { src: 'excerpt.jpg' })] },
  body: {
    type: 'root',
    children: [
      el('h1', {}, [el('img', { src: 'heading.jpg' })]),
      el('p', {}, [el('img', { src: 'para.jpg' }), el('a', { href: 'doc.pdf' })]),
      el('pre', {}, [el('code', {}, [el('img', { src: 'code.jpg' })])]),
      el('video', { src: 'video.mp4' }),
    ],
  },
} as unknown as ParsedContent

describe('content', () => {
  it('should walk meta but skip body, excerpt and internal keys', () => {
    const values: any[] = []
    walkMeta(doc, value => values.push(value))
    expect(values).toEqual(['Title', 'image.jpg', 'a.jpg', 'b.jpg'])
  })

  it('should walk body elements including headings but not code', () => {
    const tags: string[] = []
    walkBody(doc, node => tags.push(`${node.tag}:${node.props.src || node.props.href}`))
    expect(tags).toEqual([
      'img:heading.jpg',
      'img:para.jpg',
      'a:doc.pdf',
      'video:video.mp4',
    ])
  })
})
