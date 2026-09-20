import { describe, expect, it } from 'vitest'
import { walkBody, walkMeta } from '../../src/runtime/utils'

function el (tag: string, props: Record<string, any> = {}, children: any[] = []) {
  return { type: 'element', tag, props, children }
}

const content = {
  id: 'content/index.md',
  path: '/',
  stem: 'index',
  extension: 'md',
  title: 'Title',
  image: 'image.jpg',
  meta: { images: ['a.jpg', 'b.jpg'], count: 2 },
  seo: { ogImage: 'og.jpg' },
  rawbody: 'raw.jpg',
  excerpt: { type: 'minimark', value: [['img', { src: 'excerpt.jpg' }]] },
  body: {
    type: 'minimark',
    value: [
      ['h1', {}, ['img', { src: 'heading.jpg' }]],
      ['p', {}, 'text', ['img', { src: 'para.jpg' }], ['a', { href: 'doc.pdf' }, 'link']],
      ['pre', {}, ['code', {}, ['img', { src: 'code.jpg' }]]],
      ['video', { src: 'video.mp4' }],
    ],
    toc: { links: [] },
  },
}

const hastBody = {
  type: 'root',
  children: [
    el('h1', {}, [el('img', { src: 'heading.jpg' })]),
    el('p', {}, [el('img', { src: 'para.jpg' }), el('a', { href: 'doc.pdf' })]),
    el('pre', {}, [el('code', {}, [el('img', { src: 'code.jpg' })])]),
    el('video', { src: 'video.mp4' }),
  ],
}

describe('content', () => {
  it('should walk meta but skip body, excerpt, rawbody and identity keys', () => {
    const values: any[] = []
    walkMeta(content, value => values.push(value))
    expect(values).toEqual(['Title', 'image.jpg', 'a.jpg', 'b.jpg', 2, 'og.jpg'])
  })

  it('should walk minimark bodies including headings but not code', () => {
    const tags: string[] = []
    walkBody(content.body, node => tags.push(`${node.tag}:${node.props.src || node.props.href}`))
    expect(tags).toEqual(['img:heading.jpg', 'img:para.jpg', 'a:doc.pdf', 'video:video.mp4'])
  })

  it('should walk hast bodies', () => {
    const tags: string[] = []
    walkBody(hastBody, node => tags.push(`${node.tag}:${node.props.src || node.props.href}`))
    expect(tags).toEqual(['img:heading.jpg', 'img:para.jpg', 'a:doc.pdf', 'video:video.mp4'])
  })

  it('should mutate props in place', () => {
    const body = { type: 'minimark', value: [['img', { src: 'a.jpg' }]] }
    walkBody(body, node => { node.props.src = '/a.jpg' })
    expect(body.value[0][1]).toEqual({ src: '/a.jpg' })
  })

  it('should tolerate missing bodies', () => {
    expect(() => walkBody(undefined, () => {})).not.toThrow()
    expect(() => walkBody(null, () => {})).not.toThrow()
  })
})
