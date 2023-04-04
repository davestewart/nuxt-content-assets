import Path from 'path'
import { extensions, imageExtensions } from '../options'

/**
 * Test path to be relative
 */
export function isRelative (path: string): boolean {
  return !(path.startsWith('http') || Path.isAbsolute(path))
}

/**
 * Test path for image extension
 */
export function isImage (path: string): boolean {
  const ext = Path.extname(path).substring(1)
  return imageExtensions.includes(ext)
}

/**
 * Test path for asset extension
 */
export function isAsset (path: string): boolean {
  const ext = Path.extname(path).substring(1)
  return extensions.includes(ext)
}

/**
 * Test if value is a valid asset
 */
export function isValidAsset (value?: string) {
  return typeof value === 'string' && isAsset(value) && isRelative(value)
}
