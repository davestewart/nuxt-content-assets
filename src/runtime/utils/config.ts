import { matchTokens } from './string'

/**
 * Common extensions
 */
export const extensions = {
  // used to get image size
  image: matchTokens('png jpg jpeg gif svg webp ico'),

  // unused for now
  media: matchTokens('mp3 m4a wav mp4 mov webm ogg avi flv avchd'),
}

/**
 * Create a Nuxt Content ignore string
 */
export function makeIgnores (extensions: string | string[]): string {
  const matched = matchTokens(extensions)
  const ignored = matched.join('|')
  return `[^:]+\\.(?!(${ignored})$)`
}
