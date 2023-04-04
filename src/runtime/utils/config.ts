/**
 * Get matched words from a string
 */
export function matchWords (value?: string): string[] {
  return typeof value === 'string'
    ? value.match(/\w+/g) || []
    : []
}
