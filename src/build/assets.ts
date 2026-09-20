import * as Fs from 'node:fs'
import Path from 'crosspath'
import { imageSize } from 'image-size'
import { hash } from 'ohash'
import type { AssetConfig, ResolvedAsset, SrcsetOptions } from '../types'
import { getSrcset, isImage, isValidAsset, parseQuery, removeQuery, warn } from '../runtime/utils'

/**
 * In-memory index of copied assets, keyed by absolute source path
 *
 * @param publicPath  The absolute path to the public folder
 * @param srcset      Srcset options, or false to disable
 */
export function makeAssetIndex (publicPath: string, srcset: SrcsetOptions | false) {
  const assets = new Map<string, AssetConfig>()

  /**
   * Add or update an asset
   *
   * @param absSrc  The absolute path to the source file
   * @param absTrg  The absolute path to the copied file
   */
  function set (absSrc: string, absTrg: string): AssetConfig {
    const asset: AssetConfig = {
      srcAttr: '/' + Path.relative(publicPath, absTrg),
      target: absTrg,
      ...getImageSize(absTrg),
    }
    assets.set(absSrc, asset)
    return asset
  }

  function get (absSrc: string): AssetConfig | undefined {
    return assets.get(absSrc)
  }

  function remove (absSrc: string): AssetConfig | undefined {
    const asset = assets.get(absSrc)
    assets.delete(absSrc)
    return asset
  }

  function clear () {
    assets.clear()
  }

  /**
   * Resolve a value found in a document to an asset
   *
   * @param docPath   The absolute path of the document
   * @param value     The value; only relative paths with asset extensions resolve
   */
  function resolve (docPath: string, value: unknown): ResolvedAsset | undefined {
    if (!isValidAsset(value)) {
      return
    }
    const absSrc = Path.join(Path.dirname(docPath), removeQuery(value))
    const asset = assets.get(absSrc)
    if (!asset) {
      return
    }
    const resolved: ResolvedAsset = { ...asset }
    if (srcset && isImage(absSrc)) {
      Object.assign(resolved, getSrcset(absSrc, asset, path => assets.get(path), srcset))
    }
    const query = parseQuery(value)
    if (query) {
      resolved.srcAttr += query
    }
    return resolved
  }

  /**
   * A hash of everything that affects how documents are rewritten
   */
  function fingerprint (): string {
    const entries = Array.from(assets.values())
      .map(({ srcAttr, width, height }) => [srcAttr, width, height])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    return hash(entries)
  }

  return {
    set,
    get,
    remove,
    clear,
    resolve,
    fingerprint,
    get size () {
      return assets.size
    },
  }
}

export type AssetIndex = ReturnType<typeof makeAssetIndex>

/**
 * Get image dimensions for image files
 */
export function getImageSize (path: string): { width?: number, height?: number } {
  if (isImage(path)) {
    try {
      const { width, height } = imageSize(Fs.readFileSync(path))
      return { width, height }
    }
    catch {
      warn(`Could not read image "${path}"`)
    }
  }
  return {}
}
