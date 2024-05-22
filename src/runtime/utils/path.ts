import Path from 'crosspath'

import { extensions } from './config'

const SEMVER_REGEX = /^(\d+)(\.\d+)*(\.x)?$/

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

/**
 * Url refinement retrieved from nuxt content project to match behaviour.
 * https://github.com/nuxt/content/blob/fb6325a7045aa5225fbd0c0cdac65c8412116453/src/runtime/transformers/path-meta.ts#L84
 */
export function refineUrlPart (name: string): string {
  name = name.split(/[/:]/).pop()!
  // Match 1, 1.2, 1.x, 1.2.x, 1.2.3.x,
  if (SEMVER_REGEX.test(name)) {
    return name
  }

  return (
    name
      /**
       * Remove numbering
       */
      .replace(/(\d+\.)?(.*)/, '$2')
      /**
       * Remove index keyword
       */
      .replace(/^index(\.draft)?$/, '')
      /**
       * Remove draft keyword
       */
      .replace(/\.draft$/, '')
  )
}
