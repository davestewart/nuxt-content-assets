import Path from 'path'
import { hash } from 'ohash'
import { log } from './debug'

/**
 * Hash of replacer functions
 */
const replacers: Record<string, Function> = {
  folder: (src: string, dir: string) => Path.dirname(src.replace(dir, '')),
  file: (src: string) => Path.basename(src),
  name: (src: string) => Path.basename(src, Path.extname(src)),
  extname: (src: string) => Path.extname(src),
  ext: (src: string) => Path.extname(src).substring(1),
  hash: (src: string) => hash({ src }),
}

/**
 * Interpolate assets path pattern
 *
 * @param pattern   A path pattern with tokens
 * @param src       The absolute path to a src asset
 * @param dir       The absolute path to its containing folder
 * @param warn      An optional flag to warn for unknown tokens
 */
export function interpolatePattern (pattern: string, src: string, dir: string, warn = false): string {
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
