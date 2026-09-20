import * as Fs from 'node:fs'
import Path from 'crosspath'
import { imageSize } from 'image-size'
import { makeJsonStore } from './store'
import { isImage, removeEntry, warn } from '../utils'
import type { AssetConfig, AssetIndex, ContentIndex } from '../../types'

export const ASSETS_FILE = 'assets.json'
export const CONTENT_FILE = 'content.json'

export const emptyContentIndex = (): ContentIndex => ({ hits: {}, misses: {} })

/**
 * Manages the public assets folder and index (build process)
 *
 * - writes `assets.json` (asset paths and sizes)
 * - reads `content.json` (which documents reference which assets, written by the server process)
 *
 * @param publicPath  The absolute path to the public folder
 * @param watch       Whether to watch `content.json` for changes (dev only)
 */
export function makeAssetsManager (publicPath: string, watch = false) {
  const cachePath = Path.dirname(publicPath)
  const assets = makeJsonStore<AssetIndex>(cachePath, ASSETS_FILE, {})
  const content = makeJsonStore<ContentIndex>(cachePath, CONTENT_FILE, emptyContentIndex(), watch)

  /**
   * Load both indexes from disk; returns a snapshot of the previous run's assets
   */
  async function load (): Promise<AssetIndex> {
    await content.load()
    const previous = await assets.load()
    return { ...previous }
  }

  /**
   * Remove all files from the public folder
   */
  function clear () {
    if (Fs.existsSync(publicPath)) {
      for (const name of Fs.readdirSync(publicPath)) {
        if (!/^\.git(?:ignore|keep)$/.test(name)) {
          removeEntry(Path.join(publicPath, name))
        }
      }
    }
    for (const key of Object.keys(assets.data)) {
      delete assets.data[key]
    }
  }

  /**
   * Add or update an asset by its absolute public path
   */
  function setAsset (path: string): AssetConfig {
    const { srcRel, srcAttr } = getAssetPaths(publicPath, path)
    const asset: AssetConfig = { srcAttr, ...getAssetSize(path) }
    assets.data[srcRel] = asset
    assets.save()
    return asset
  }

  /**
   * Get an asset by its absolute public path
   */
  function getAsset (path: string): AssetConfig | undefined {
    const { srcRel } = getAssetPaths(publicPath, path)
    return assets.data[srcRel]
      ? { ...assets.data[srcRel] }
      : undefined
  }

  /**
   * Remove an asset by its absolute public path
   */
  function removeAsset (path: string): AssetConfig | undefined {
    const { srcRel } = getAssetPaths(publicPath, path)
    const asset = assets.data[srcRel]
    if (asset) {
      delete assets.data[srcRel]
      assets.save()
    }
    return asset
  }

  /**
   * Get the ids of documents that referenced an asset (by public path)
   */
  function getContentIds (path: string): string[] {
    const { srcRel } = getAssetPaths(publicPath, path)
    return content.data.hits[srcRel] || []
  }

  return {
    load,
    clear,
    setAsset,
    getAsset,
    removeAsset,
    getContentIds,
    get assets () {
      return assets.data
    },
    get content () {
      return content.data
    },
    dispose: async () => {
      await assets.dispose()
      await content.dispose()
    },
  }
}

export type AssetsManager = ReturnType<typeof makeAssetsManager>

// ---------------------------------------------------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Parse asset paths from absolute path
 *
 * @param publicPath  The absolute path to the public folder
 * @param srcAbs      The absolute path to the asset itself
 */
export function getAssetPaths (publicPath: string, srcAbs: string) {
  const srcRel = Path.relative(publicPath, srcAbs)
  return {
    srcRel,
    srcAttr: '/' + srcRel,
  }
}

/**
 * Get image dimensions for image assets
 *
 * @param srcAbs    The absolute path to the asset itself
 */
export function getAssetSize (srcAbs: string): { width?: number, height?: number } {
  if (isImage(srcAbs)) {
    try {
      const { width, height } = imageSize(Fs.readFileSync(srcAbs))
      return { width, height }
    }
    catch {
      warn(`Could not read image "${srcAbs}"`)
    }
  }
  return {}
}
