/**
 * Get matched words from a string
 */
export function matchWords (value?: string): string[] {
  return typeof value === 'string'
    ? value.match(/\w+/g) || []
    : []
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
