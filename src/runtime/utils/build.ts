/**
 * Build a style string by passing multiple independent expressions
 */
export function buildStyle (...expr: string[]) {
  return expr
    .map(expr => expr.replace(/^[; ]+|[; ]+$/g, ''))
    .filter(s => s)
    .join(';')
    .replace(/\s*;\s*/g, '; ') + ';'
}

/**
 * Build a query string by passing multiple independent expressions
 */
export function buildQuery (...expr: string[]) {
  const output = expr
    .map(expr => expr.replace(/^[?&]+|&+$/g, ''))
    .filter(s => s)
  if (output.length) {
    const [first, ...rest] = output
    const isParam = (expr: string) => /^[^?]+=[^=]+$/.test(expr)
    return !isParam(first)
      ? rest.length > 0
        ? first + (first.includes('?') ? '&' : '?') + rest.join('&')
        : first
      : '?' + output.join('&')
  }
  return ''
}
