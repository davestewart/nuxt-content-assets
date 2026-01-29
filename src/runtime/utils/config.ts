import { matchTokens } from './string'

/**
 * Common extensions
 */
export const extensions = {
  // used to recognise content
  content: matchTokens('md mdx json yml yaml csv'),

  // used to get image size
  image: matchTokens('png jpg jpeg gif svg webp ico avif bmp cur'),

  // unused for now
  media: matchTokens('mp3 m4a wav mp4 mov webm ogg avi flv avchd'),
}

/**
 * Create a Nuxt Content ignore string
 *
 * @see https://regex101.com/r/gC3HXz/2
 */
export function makeIgnores (extensions: string | string[]): string {
  const tokens = matchTokens(extensions)

  if (tokens.length === 0) {
    return ''
  }

  const disallowTail = tokens.join("$|") + "$"
  return `\\.(?!${disallowTail})[^.]+$`
}
