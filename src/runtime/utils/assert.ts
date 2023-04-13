import Path from 'path'
import { extensions } from '../options'

/**
 * Test path to be relative
 */
export function isRelative (path: string): boolean {
  return !(path.startsWith('http') || Path.isAbsolute(path))
}

/**
 * Test if path is excluded (_partial or .ignored)
 * @param path
 */
export function isExcluded (path: string) {
  return path.split('/').some(segment => segment.startsWith('.') || segment.startsWith('_'))
}

/**
 * Test path for image extension
 */
export function isImage (path: string): boolean {
  const ext = Path.extname(path).substring(1)
  return extensions.image.includes(ext)
}

/**
 * Test path is markdown
 */
export function isArticle (path: string): boolean {
  return path.endsWith('.md')
}

/**
 * Test path is asset
 */
export function isAsset (path: string): boolean {
  return !isExcluded(path) && !isArticle(path)
}

/**
 * Test if value is a relative asset
 */
export function isValidAsset (value?: string): boolean {
  return typeof value === 'string' && isAsset(value) && isRelative(value)
}

