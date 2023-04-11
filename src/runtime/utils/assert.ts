import Path from 'path'
import { extensions } from '../options'

/**
 * Test path to be relative
 */
export function isRelative (path: string): boolean {
  return !(path.startsWith('http') || Path.isAbsolute(path))
}

/**
 * Test path or id for image extension
 */
export function isImage (path: string): boolean {
  const ext = Path.extname(path).substring(1)
  return extensions.image.includes(ext)
}

/**
 * Test path or id is markdown
 */
export function isArticle (path: string): boolean {
  return /\.mdx?$/.test(path)
}

/**
 * Test path or id is asset
 */
export function isAsset (path: string): boolean {
  const ext = Path.extname(path)
  return !!ext && ext !== '.DS_Store' && !isArticle(path)
}

/**
 * Test if value is a relative asset
 */
export function isValidAsset (value?: string): boolean {
  return typeof value === 'string' && isAsset(value) && isRelative(value)
}
