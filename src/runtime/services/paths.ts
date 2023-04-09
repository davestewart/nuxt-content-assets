import Path from 'path'
import { hash } from 'ohash'
import { log } from '../utils'

/**
 * Hash of replacer functions
 */
const replacers: Record<string, (src: string) => string> = {
  key: (src: string) => Path.dirname(src).split('/').filter(e => e).shift() || '',
  path: (src: string) => Path.dirname(src),
  folder: (src: string) => Path.dirname(src).replace(/[^/]+\//, ''),
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
 * @param src       The relative path to a src asset
 * @param warn      An optional flag to warn for unknown tokens
 */
export function interpolatePattern (pattern: string, src: string, warn = false): string {
  return Path.join(pattern.replace(/\[\w+]/g, (match: string) => {
    const name = match.substring(1, match.length - 1)
    const fn = replacers[name]
    if (fn) {
      return fn(src)
    }
    if (warn) {
      log(`Unknown output token ${match}`, true)
    }
    return match
  }))
}
