import type { MountOptions } from '@nuxt/content'

/**
 * Get content source folders
 *
 * @param sources
 */
export function getSources (sources: Record<string, MountOptions>): Record<string, string> {
  return Object.keys(sources).reduce((output, key) => {
    const source = sources[key]
    if (source) {
      const { driver, base } = source
      if (driver === 'fs') {
        output[key] = base
      }
    }
    return output
  }, {} as Record<string, string>)
}
