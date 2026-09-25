import { $fetch } from '@nuxt/test-utils/e2e'

/**
 * Fetch a parsed document from the fixture's `/api/doc/**` route
 */
export function getDoc (path: string): Promise<Record<string, any>> {
  return $fetch(`/api/doc${path}`)
}

/**
 * Collect the props of every AST element with the given tag
 */
export function findProps (node: any, tag: string, found: Record<string, any>[] = []): Record<string, any>[] {
  if (node?.tag === tag) {
    found.push(node.props)
  }
  for (const child of node?.children || []) {
    findProps(child, tag, found)
  }
  return found
}

/**
 * Get the props of the element with the given tag and alt text
 */
export function findImage (body: any, alt: string): Record<string, any> | undefined {
  return findProps(body, 'img').find(props => props.alt === alt)
}
