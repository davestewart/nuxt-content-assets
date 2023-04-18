/**
 * Get matched tokens (words, expressions) from a string or an array of possible strings
 *
 * Tokens may be separated by space, comma or pipe
 */
export function matchTokens (value: any): string[] {
  let tokens: string[] = []
  if (typeof value === 'string') {
    tokens = value.match(/[^\s,|]+/g) || []
  }
  else if (Array.isArray(value)) {
    tokens = value
      .filter(value => typeof value === 'string')
      .reduce((output: string[], input) => {
        return [ ...output, ...matchTokens(input)]
      }, [])
  }
  else if (!!value && typeof value === 'object') {
    tokens = Object.values(value).reduce((output: string[], value) => {
      return [...output, ...matchTokens(value)]
    }, [])
  }
  return tokens.length
    ? Array.from(new Set(tokens))
    : tokens
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

