import * as Fs from 'node:fs'
import * as Os from 'node:os'
import Path from 'crosspath'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAssetResolver } from '../../src/runtime/assets/resolver'
import { makeJsonStore } from '../../src/runtime/assets/store'
import { emptyContentIndex } from '../../src/runtime/assets/public'
import { getStaleContentIds } from '../../src/runtime/content/cache'
import { resolveSrcsetOptions } from '../../src/runtime/utils'
import type { AssetIndex, ContentIndex, ParsedContent } from '../../src/types'

let cachePath: string

beforeEach(() => {
  cachePath = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'nca-resolver-'))
})

afterEach(() => {
  Fs.rmSync(cachePath, { recursive: true, force: true })
})

function writeJson (file: string, data: unknown) {
  Fs.writeFileSync(Path.join(cachePath, file), JSON.stringify(data))
}

// the store writes asynchronously, so wait for the file to land
function readJson<T> (file: string): Promise<T> {
  return vi.waitFor(() => JSON.parse(Fs.readFileSync(Path.join(cachePath, file), 'utf8')))
}

const doc = { _id: 'content:posts:index.md', _file: 'posts/index.md' } as ParsedContent

describe('store', () => {
  it('should not leak nested writes into the initial data', async () => {
    const initial = emptyContentIndex()
    const store = makeJsonStore<ContentIndex>(cachePath, 'content.json', initial)
    store.data.hits['a.jpg'] = ['content:a.md']
    expect(initial).toEqual(emptyContentIndex())

    // reloading with no file on disk should reset to the initial data
    await store.load()
    expect(store.data).toEqual(emptyContentIndex())
    await store.dispose()
  })
})

describe('resolver', () => {
  const photo: AssetIndex = {
    'posts/photo.png': { srcAttr: '/posts/photo.png', width: 100, height: 100 },
  }

  it('should register srcset variants so variant changes invalidate documents', async () => {
    const prev: AssetIndex = {
      ...photo,
      'posts/photo@2x.png': { srcAttr: '/posts/photo@2x.png', width: 200, height: 200 },
    }
    writeJson('assets.json', prev)

    const resolver = makeAssetResolver(Path.join(cachePath, 'public'), { srcset: resolveSrcsetOptions(true) })
    await resolver.ready
    expect(resolver.resolve(doc, './photo.png')?.srcset).toBe('/posts/photo.png 100w, /posts/photo@2x.png 200w')
    await resolver.dispose()

    const content = await readJson<ContentIndex>('content.json')
    expect(content.hits['posts/photo@2x.png']).toEqual([doc._id])
    expect(content.misses['posts/photo@3x.png']).toEqual([doc._id])

    // variant added
    const added = { ...prev, 'posts/photo@3x.png': { srcAttr: '/posts/photo@3x.png', width: 300, height: 300 } }
    expect(getStaleContentIds(prev, added, content)).toEqual([doc._id])

    // variant removed
    expect(getStaleContentIds(prev, photo, content)).toEqual([doc._id])

    // variant resized
    const resized = { ...prev, 'posts/photo@2x.png': { srcAttr: '/posts/photo@2x.png', width: 220, height: 220 } }
    expect(getStaleContentIds(prev, resized, content)).toEqual([doc._id])
  })

  it('should not register variants when srcset is disabled', async () => {
    writeJson('assets.json', photo)

    const resolver = makeAssetResolver(Path.join(cachePath, 'public'), { srcset: false })
    await resolver.ready
    resolver.resolve(doc, './photo.png')
    await resolver.dispose()

    expect(await readJson<ContentIndex>('content.json')).toEqual({
      hits: { 'posts/photo.png': [doc._id] },
      misses: {},
    })
  })
})
