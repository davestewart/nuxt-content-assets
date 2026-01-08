import Path from 'crosspath'

import { extensions } from './config'

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
 * Gets the extension of a path
 * @param path
 */
export function getExt (path: string) {
  return Path.extname(removeQuery(path)).substring(1)
}

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
  return extensions.image.includes(getExt(path))
}

/**
 * Test path is markdown or data
 */
export function isArticle (path: string): boolean {
  return extensions.content.includes(getExt(path))
}

/**
 * Test path is asset
 */
export function isAsset (path: string): boolean {
  return !isArticle(path)
}

/**
 * Test if value is a relative asset
 */
export function isValidAsset (value?: string): boolean {
  return typeof value === 'string' && isAsset(value) && isRelative(value)
}
