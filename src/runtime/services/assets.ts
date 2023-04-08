import * as Path from 'path'
import getImageSize from 'image-size'
import { isImage, warn } from '../utils'
import { interpolatePattern } from './paths'

export type AssetConfig = {
  id: string
  srcRel: string
  srcAttr: string
  width?: number
  height?: number
  ratio?: string
  query?: string
}

/**
 * Get config for asset
 *
 * @param srcDir    The absolute path to the asset's source folder
 * @param srcAbs    The absolute path to the asset itself
 * @param pattern   The user-defined pattern to create the public src attribute
 * @param hints     A list of named image size hints, i.e. 'style', 'attrs', etc
 */
export function getAssetConfig (srcDir: string, srcAbs: string, pattern: string, hints: string[]): AssetConfig {
  // variables
  let width: number | undefined = undefined
  let height: number | undefined = undefined
  let ratio: string | undefined = undefined
  let query: string | undefined = undefined

  // image dimensions
  if (hints.length && isImage(srcAbs)) {
    try {
      const size = getImageSize(srcAbs)
      if (hints.includes('style')) {
        ratio = `${size.width}/${size.height}`
      }
      if (hints.includes('attrs')) {
        width = size.width
        height = size.height
      }
      if (hints.includes('url')) {
        query = `?width=${width}&height=${height}`
      }
    }
    catch (err) {
      warn(`could not read image "${srcAbs}`)
    }
  }

  // relative asset path
  const srcRel = Path.basename(srcDir) + srcAbs.substring(srcDir.length)

  // interpolated public path
  const srcAttr = interpolatePattern(pattern, srcRel)

  // content id
  const id = srcRel.replaceAll('/', ':')

  // return
  return { id, srcRel, srcAttr, width, height, ratio, query }
}
