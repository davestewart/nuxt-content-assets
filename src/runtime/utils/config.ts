import { matchTokens } from './string'

/**
 * Default content extensions (tokens may be regex fragments)
 */
export const defaultContentExtensions = 'mdx? csv ya?ml json'

/**
 * Common extensions
 */
export const extensions = {
  // used to get image size
  image: matchTokens('png jpg jpeg gif svg webp ico avif bmp cur'),
}

let contentRx = makeExtensionRegExp(defaultContentExtensions)

/**
 * Configure which extensions are treated as content (everything else is an asset)
 */
export function setContentExtensions (extensions: string | string[] = defaultContentExtensions) {
  contentRx = makeExtensionRegExp(extensions)
}

/**
 * Test an extension (without the dot) against the configured content extensions
 */
export function isContentExtension (ext: string): boolean {
  return contentRx.test(ext)
}

/**
 * Build a RegExp that matches any of the supplied extension tokens
 */
export function makeExtensionRegExp (extensions: string | string[]): RegExp {
  const tokens = matchTokens(extensions)
  return tokens.length
    ? new RegExp(`^(?:${tokens.join('|')})$`, 'i')
    : /^$/
}
