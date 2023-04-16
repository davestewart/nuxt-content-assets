import * as Path from 'path'
import getImageSize from 'image-size'
import { isImage, warn } from '../utils'

export type AssetConfig = {
  documents: string[],
  srcAttr: string
  width?: number
  height?: number
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
export function getAssetSizes (srcAbs: string): { width?: number, height?: number } {
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
