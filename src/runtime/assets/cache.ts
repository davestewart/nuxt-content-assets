import Path from 'path'
import debounce from 'debounce'
import { AssetConfig, getAssetPaths, getAssetSize, makeStorage } from '../services'
import { writeFile } from '../utils'

/**
 * Manages the saved assets index
 */
export function makeAssetsManager (cachePath: string, publicPath: string) {

  // ---------------------------------------------------------------------------------------------------------------------
  // storage
  // ---------------------------------------------------------------------------------------------------------------------

  // variables
  const indexKey = 'assets.json'
  const indexPath = Path.join(cachePath, indexKey)

  // storage
  const storage = makeStorage(cachePath)
  storage.watch(async (event: string, key: string) => {
    if (event === 'update' && key === indexKey) {
      await load()
    }
  })

  // assets
  const assets: Record<string, AssetConfig> = {}
  async function load () {
    const data = await storage.getItem(indexKey) as Record<string, AssetConfig>
    Object.assign(assets, data)
  }

  /**
   * Debounced handler to save assets config
   */
  const save = debounce(() => {
    writeFile(indexPath, assets)
  }, 50)

  // ---------------------------------------------------------------------------------------------------------------------
  // accessors
  // ---------------------------------------------------------------------------------------------------------------------

  /**
   * Get an asset based on document path
   *
   * @param srcDoc
   * @param relAsset
   * @param updateDocument
   */
  function getDocumentAsset (srcDoc: string, relAsset: string, updateDocument = false) {
    const srcDir = Path.dirname(srcDoc)
    const srcAsset = Path.join(srcDir, relAsset)
    const asset = assets[srcAsset]
    if (asset && updateDocument) {
      setAssetDocument(srcAsset, srcDoc)
    }
    return asset || {}
  }

  /**
   * Set an asset document
   */
  function setAssetDocument (srcAsset: string, srcDoc: string) {
    const asset = assets[srcAsset]
    if (!asset.documents.includes(srcDoc)) {
      asset.documents.push(srcDoc)
      storage.setItem(indexKey, assets)
    }
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // data
  // ---------------------------------------------------------------------------------------------------------------------

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
   * Update a cached asset by its absolute public path
   */
  function updateAsset (path: string): AssetConfig {
    // variables
    const { srcRel, srcAttr } = getAssetPaths(publicPath, path)
    const { width, height } = getAssetSize(path)

    // add assets to config
    const oldAsset = assets[srcRel]
    const newAsset = {
      documents: oldAsset?.documents || [],
      srcAttr,
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
    load,
    getAsset,
    updateAsset,
    removeAsset,
    getDocumentAsset,
    assets,
  }
}
