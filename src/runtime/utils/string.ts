/**
 * Get matched tokens (words, expressions) from a string or an array of possible strings
 *
 * Tokens may be separated by space, comma or pipe
 */
export function matchTokens (value?: string | unknown[]): string[] {
  const tokens = typeof value === 'string'
    ? value.match(/[^\s,|]+/g) || []
    : Array.isArray(value)
      ? value
        .filter(value => typeof value === 'string')
        .reduce((output, input) => {
          return [ ...output, ...matchTokens(input)]
        }, [])
      : []
  return Array.from(new Set(tokens))
}

export function toPath (key: string): string {
  return key.replaceAll(':', '/')
}

export function toKey (path: string) {
  return path.replaceAll('/', ':')
}

export function deKey (path: string) {
  return path.replace(/^[^:]+:/, '')
}
