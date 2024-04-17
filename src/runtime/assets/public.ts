import * as Fs from 'fs'
import Path from 'crosspath'
import getImageSize from 'image-size'
import debounce from 'debounce'
import { hash } from 'ohash'
import type { ParsedContent, AssetConfig } from '../../types'
import { makeSourceStorage } from './source'
import { isImage, warn, log, removeEntry } from '../utils'

/**
 * Manages the public assets
 */
export function makeAssetsManager (publicPath: string, shouldWatch = true) {

  // ---------------------------------------------------------------------------------------------------------------------
  // storage - updates asset index file, watches for changes from other processes
  // ---------------------------------------------------------------------------------------------------------------------

  // variables
  const assetsKey: string = 'assets.json'

  // storage
  const storage = makeSourceStorage(Path.join(publicPath, '..'))
  if (shouldWatch) {
    void storage.watch(async (event: string, key: string) => {
      if (event === 'update' && key === assetsKey) {
        await load()
      }
    })
  }

  // assets
  const assets: Record<string, AssetConfig> = {}
  async function load () {
    const data = await storage.getItem(assetsKey)
    // console.log('load:', data)
    Object.assign(assets, data || {})
  }

  const save = debounce(function () {
    // console.log('save:', assets)
    void storage.setItem(assetsKey, assets)
  }, 50)

  // ---------------------------------------------------------------------------------------------------------------------
  // content - get
  // ---------------------------------------------------------------------------------------------------------------------

  /**
   * Resolve relative asset from content
   *
   * @param content
   * @param relAsset
   * @param registerContent
   */
  function resolveAsset (content: ParsedContent, relAsset: string, registerContent = false): Partial<AssetConfig> {
    const srcDir = Path.dirname(content._file)
    const srcAsset = Path.join(srcDir, relAsset)
    const asset = assets[srcAsset]
    if (asset && registerContent) {
      const { _id } = content
      if (!asset.content.includes(_id)) {
        asset.content.push(_id)
        save()
      }
    }
    return asset || {}
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // asset - get and set asset data from absolute paths (used in watching)
  // ---------------------------------------------------------------------------------------------------------------------

  /**
   * Update a cached asset by its absolute public path
   *
   * When called by build, used to register images for the first time
   * When called by watch, used to update image size, etc
   *
   * @param path Absolute path to the asset
   */
  function setAsset (path: string): AssetConfig {
    // variables
    const { srcRel, srcAttr } = getAssetPaths(publicPath, path)
    const { width, height } = getAssetSize(path)

    // add assets to config
    const oldAsset = assets[srcRel]
    const newAsset = {
      srcAttr,
      content: oldAsset?.content || [],
      width,
      height,
    }

    // update
    assets[srcRel] = newAsset
    save()

    // return
    return newAsset
  }

  /**
   * Get a cached asset by its absolute public path
   */
  function getAsset (path: string): AssetConfig | undefined {
    const { srcRel } = getAssetPaths(publicPath, path)
    return srcRel
      ? { ...assets[srcRel] }
      : undefined
  }

  /**
   * Remove a cached asset by its absolute public path
   */
  function removeAsset (path: string): AssetConfig | undefined {
    const { srcRel } = getAssetPaths(publicPath, path)
    const asset = assets[srcRel]
    if (asset) {
      delete assets[srcRel]
      save()
    }
    return asset
  }

  /**
   * Remove public asset files
   */
  const init = () => {
    if (Fs.existsSync(publicPath)) {
      const names = Fs.readdirSync(publicPath)
      for (const name of names) {
        if (!/^\.git(ignore|keep)$/.test(name)) {
          removeEntry(Path.join(publicPath, name))
        }
      }
    }
  }

  // start
  void load()

  // return
  return {
    init,
    setAsset,
    getAsset,
    removeAsset,
    resolveAsset,
    dispose: async () => {
      await storage.unwatch()
      await storage.dispose()
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// utils
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Hash of replacer functions
 */
export const replacers: Record<string, (src: string) => string> = {
  key: (src: string) => Path.dirname(src).split('/').filter(e => e).shift() || '',
  path: (src: string) => Path.dirname(src),
  folder: (src: string) => Path.dirname(src).replace(/[^/]+\//, ''),
  file: (src: string) => Path.basename(src),
  name: (src: string) => Path.basename(src, Path.extname(src)),
  extname: (src: string) => Path.extname(src),
  ext: (src: string) => Path.extname(src).substring(1),
  hash: (src: string) => hash({ src }),
}

/**
 * Interpolate assets path pattern
 *
 * @param pattern   A path pattern with tokens
 * @param src       The relative path to a src asset
 * @param warn      An optional flag to warn for unknown tokens
 */
export function interpolatePattern (pattern: string, src: string, warn = false): string {
  return Path.join(pattern.replace(/\[\w+]/g, (match: string) => {
    const name = match.substring(1, match.length - 1)
    const fn = replacers[name]
    if (fn) {
      return fn(src)
    }
    if (warn) {
      log(`Unknown output token ${match}`, true)
    }
    return match
  }))
}

/**
 * Parse asset paths from absolute path
 *
 * @param srcDir    The absolute path to the asset's source folder
 * @param srcAbs    The absolute path to the asset itself
 */
export function getAssetPaths (srcDir: string, srcAbs: string) {
  // relative asset path
  const srcRel = Path.relative(srcDir, srcAbs)

  // interpolated public path
  const srcAttr = '/' + srcRel

  // return
  return {
    srcRel,
    srcAttr,
  }
}

/**
 * Get asset image sizes
 *
 * @param srcAbs    The absolute path to the asset itself
 */
export function getAssetSize (srcAbs: string): { width?: number, height?: number } {
  if (isImage(srcAbs)) {
    try {
      return getImageSize(srcAbs)
    }
    catch (err) {
      warn(`could not read image "${srcAbs}`)
    }
  }
  return {}
}
