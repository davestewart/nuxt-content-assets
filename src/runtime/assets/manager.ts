import getImageSize from 'image-size'
import debounce from 'debounce'
import * as Path from 'path'
import { ParsedContent, AssetConfig } from '../../types'
import { makeSourceStorage } from '../sources/manager'
import { isImage, warn } from '../utils'

/**
 * Manages the saved assets index
 */
export function makeAssetsManager (publicPath: string) {

  // ---------------------------------------------------------------------------------------------------------------------
  // storage - updates asset index, watches for changes from other processes
  // ---------------------------------------------------------------------------------------------------------------------

  // variables
  const indexKey = 'assets.json'

  // storage
  const storage = makeSourceStorage(Path.join(publicPath, '..'))
  storage.watch(async (event: string, key: string) => {
    if (event === 'update' && key === indexKey) {
      await load()
    }
  })

  // assets
  const assets: Record<string, AssetConfig> = {}
  async function load () {
    const data = await storage.getItem(indexKey)
    // console.log('load:', data)
    Object.assign(assets, data || {})
  }

  const save = debounce(function () {
    // console.log('save:', assets)
    storage.setItem(indexKey, assets)
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
  function resolveAsset (content: ParsedContent, relAsset: string, registerContent = false) {
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

  // start
  void load()

  // return
  return {
    setAsset,
    getAsset,
    removeAsset,
    resolveAsset,
  }
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

  // content id
  const id = srcRel.replaceAll('/', ':')

  // return
  return {
    id,
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
