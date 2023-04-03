import Path from 'path'
import { hash as ohash } from 'ohash'
import { extensions, imageExtensions } from '../options'
import { log } from './debug'

/**
 * Get matched words from a string
 */
export function matchWords (value: string) {
  return value.match(/\w+/g) || []
}

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

/**
 * Interpolate assets path pattern
 *
 * @param pattern   A path pattern with tokens
 * @param src       The absolute path to a src asset
 * @param dir       The absolute path to its containing folder
 * @param warn      An optional flag to warn for unknown tokens
 */
export function interpolatePattern (pattern: string, src: string, dir: string, warn = false) {
  return Path.join(pattern.replace(/\[\w+]/g, (match: string) => {
    const name = match.substring(1, match.length - 1)
    const fn = replacers[name]
    if (fn) {
      return fn(src, dir)
    }
    if (warn) {
      log(`Unknown output token ${match}`, true)
    }
    return match
  }))
}

/**
 * Hash of replacer functions
 */
export const replacers: Record<string, Function> = {
  folder: (src: string, dir: string) => Path.dirname(src.replace(dir, '')),
  file: (src: string) => Path.basename(src),
  name: (src: string) => Path.basename(src, Path.extname(src)),
  extname: (src: string) => Path.extname(src),
  ext: (src: string) => Path.extname(src).substring(1),
  hash: (src: string) => ohash({ src }),
}
