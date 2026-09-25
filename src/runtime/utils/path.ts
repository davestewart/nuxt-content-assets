import Path from 'crosspath'
import { extensions, isContentExtension } from './config'

/**
 * Parses the query string from a path
 */
export function parseQuery (path: string): string {
  const matches = path.match(/\?.+$/)
  return matches
    ? matches[0]
    : ''
}

/**
 * Removes the query string from a path
 */
export function removeQuery (path: string): string {
  return path.replace(/\?.*$/, '')
}

/**
 * Remove ordering from a path
 */
export function removeOrdering (path: string): string {
  return path
    .split('/')
    .map(segment => segment.replace(/^\d+\./, ''))
    .join('/')
}

/**
 * Gets the extension of a path (without the dot)
 */
export function getExt (path: string): string {
  return Path.extname(removeQuery(path)).substring(1)
}

/**
 * Test path to be relative (not a URL, protocol, anchor or absolute path)
 */
export function isRelative (path: string): boolean {
  return !/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(path)
}

/**
 * Test if path is excluded (_partial or .ignored)
 */
export function isExcluded (path: string): boolean {
  return path.split('/').some(segment => segment.startsWith('.') || segment.startsWith('_'))
}

/**
 * Test path for image extension
 */
export function isImage (path: string): boolean {
  return extensions.image.includes(getExt(path).toLowerCase())
}

/**
 * Test path is markdown or data
 */
export function isArticle (path: string): boolean {
  return isContentExtension(getExt(path))
}

/**
 * Test path is an asset (has an extension which is not a content extension)
 */
export function isAsset (path: string): boolean {
  const ext = getExt(path)
  return ext !== '' && !isContentExtension(ext)
}

/**
 * Test if value is a relative asset path
 */
export function isValidAsset (value: unknown): value is string {
  return typeof value === 'string' && isRelative(value) && isAsset(value)
}
