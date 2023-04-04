/**
 * Get matched words from a string
 */
export function matchWords (value?: string) {
  return typeof value === 'string'
    ? value.match(/\w+/g) || []
    : []
}
