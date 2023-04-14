import * as Path from 'path'
import getImageSize from 'image-size'
import { isImage, warn } from '../utils'

export type AssetConfig = {
  id?: string
  srcRel: string
  srcAttr: string
  width?: number
  height?: number
  ratio?: string
  query?: string
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
 * @param hints     A list of named image size hints, i.e. 'style', 'attrs', etc
 */
export function getAssetSizes (srcAbs: string, hints: string[]) {
  // variables
  let width: number | undefined = undefined
  let height: number | undefined = undefined
  let ratio: string | undefined = undefined
  let query: string | undefined = undefined

  // image dimensions
  if (hints.length && isImage(srcAbs)) {
    try {
      const size = getImageSize(srcAbs)
      if (hints.includes('attrs')) {
        width = size.width
        height = size.height
      }
      if (hints.includes('style')) {
        ratio = `${size.width}/${size.height}`
      }
      if (hints.includes('url')) {
        query = `?width=${size.width}&height=${size.height}`
      }
    }
    catch (err) {
      warn(`could not read image "${srcAbs}`)
    }
  }

  return {
    width,
    height,
    ratio,
    query,
  }
}
