import { matchTokens } from './string'

/**
 * Common extensions
 */
export const extensions = {
  // used to get image size
  image: matchTokens('png jpg jpeg gif svg webp ico'),

  // used to recognise content
  content: matchTokens('md mdx json yml yaml csv'),

  // unused for now
  media: matchTokens('mp3 m4a wav mp4 mov webm ogg avi flv avchd'),
}

/**
 * Create a Nuxt Content ignore string
 *
 * @see https://stackoverflow.com/questions/10052032/regex-pattern-that-does-not-match-certain-extensions
 * @see https://regex101.com/r/gC3HXz/1
 */
export function makeIgnores (extensions: string | string[]): string {
  const included = matchTokens(extensions).join('|')
  return `^(?:(?!(${included})).)+$`
}
