import Path from 'crosspath'
import { makeJsonStore } from './store'
import { ASSETS_FILE, CONTENT_FILE, emptyContentIndex } from './public'
import { getSrcset, getVariantKey, isImage, isValidAsset, parseQuery, removeOrdering, removeQuery } from '../utils'
import type { AssetIndex, ContentIndex, ParsedContent, ResolvedAsset, SrcsetOptions } from '../../types'

export interface ResolverOptions {
  /**
   * Whether to watch `assets.json` for changes (dev only)
   */
  watch?: boolean

  /**
   * Srcset options, or false to disable
   */
  srcset?: SrcsetOptions | false
}

/**
 * Resolves relative asset paths in parsed content (server process)
 *
 * - reads `assets.json` (written by the build process)
 * - writes `content.json` (which documents reference which assets)
 *
 * @param publicPath  The absolute path to the public folder
 * @param options     Resolver options
 */
export function makeAssetResolver (publicPath: string, options: ResolverOptions = {}) {
  const cachePath = Path.dirname(publicPath)
  const assets = makeJsonStore<AssetIndex>(cachePath, ASSETS_FILE, {}, options.watch)
  const content = makeJsonStore<ContentIndex>(cachePath, CONTENT_FILE, emptyContentIndex())

  const ready = Promise.all([assets.load(), content.load()])

  function register (map: Record<string, string[]>, key: string, id: string) {
    const ids = map[key] ||= []
    if (!ids.includes(id)) {
      ids.push(id)
      content.save()
    }
  }

  /**
   * Get the index key for a relative path in a document
   */
  function getKey (doc: ParsedContent, relPath: string): string {
    return removeOrdering(Path.join(Path.dirname(doc._file), removeQuery(relPath)))
  }

  /**
   * Resolve a relative asset path referenced by a document
   *
   * Returns undefined if the value is not a relative asset path, or the asset is not in the index
   */
  function resolve (doc: ParsedContent, value: unknown): ResolvedAsset | undefined {
    if (!isValidAsset(value)) {
      return
    }
    const key = getKey(doc, value)
    const asset = assets.data[key]
    if (!asset) {
      register(content.data.misses, key, doc._id)
      return
    }
    register(content.data.hits, key, doc._id)

    const resolved: ResolvedAsset = { ...asset }
    if (options.srcset && isImage(key)) {
      // register variants too, so adding, removing or resizing one invalidates the document
      const { scales, pattern } = options.srcset
      for (const scale of scales) {
        const variantKey = getVariantKey(key, scale, pattern)
        register(assets.data[variantKey] ? content.data.hits : content.data.misses, variantKey, doc._id)
      }
      Object.assign(resolved, getSrcset(key, asset, assets.data, options.srcset))
    }
    const query = parseQuery(value)
    if (query) {
      resolved.srcAttr += query
    }
    return resolved
  }

  return {
    ready,
    resolve,
    dispose: async () => {
      await assets.dispose()
      await content.dispose()
    },
  }
}
