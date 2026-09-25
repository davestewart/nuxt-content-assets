import { describe, expect, it } from 'vitest'
import { diffAssets, getStaleContentIds } from '../../src/runtime/content/cache'
import type { AssetIndex, ContentIndex } from '../../src/types'

const prev: AssetIndex = {
  'a.jpg': { srcAttr: '/a.jpg', width: 10, height: 10 },
  'b.jpg': { srcAttr: '/b.jpg', width: 10, height: 10 },
  'c.jpg': { srcAttr: '/c.jpg', width: 10, height: 10 },
}

const next: AssetIndex = {
  'a.jpg': { srcAttr: '/a.jpg', width: 10, height: 10 },
  'b.jpg': { srcAttr: '/b.jpg', width: 20, height: 20 },
  'd.jpg': { srcAttr: '/d.jpg', width: 10, height: 10 },
}

const content: ContentIndex = {
  hits: {
    'a.jpg': ['content:a.md'],
    'b.jpg': ['content:b.md', 'content:shared.md'],
    'c.jpg': ['content:c.md', 'content:shared.md'],
  },
  misses: {
    'd.jpg': ['content:d.md'],
    'e.jpg': ['content:e.md'],
  },
}

describe('cache', () => {
  it('should diff asset indexes', () => {
    expect(diffAssets(prev, next)).toEqual({
      added: ['d.jpg'],
      removed: ['c.jpg'],
      changed: ['b.jpg'],
    })
  })

  it('should work out which documents are stale', () => {
    expect(getStaleContentIds(prev, next, content).sort()).toEqual([
      'content:b.md',
      'content:c.md',
      'content:d.md',
      'content:shared.md',
    ])
  })

  it('should report nothing stale when nothing changed', () => {
    expect(getStaleContentIds(prev, prev, content)).toEqual([])
  })
})
