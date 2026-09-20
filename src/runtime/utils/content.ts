import { type WalkCallback, walk } from './object'
import { matchTokens } from './string'

/**
 * A uniform view of an element in either a hast or minimark tree
 */
export interface ElementView {
  tag: string
  props: Record<string, any>
}

/**
 * Keys which hold ASTs, raw content or identity, rather than user data
 */
const nonMetaKeys = ['body', 'excerpt', 'rawbody', '__metadata', 'id', 'path', 'stem', 'extension']

/**
 * Walk parsed content fields (frontmatter and schema fields), skipping ASTs and identity fields
 */
export function walkMeta (content: Record<string, any>, callback: WalkCallback) {
  walk(content, callback, (value, key) => !(typeof key === 'string' && nonMetaKeys.includes(key)))
}

/**
 * Walk a parsed body or excerpt (hast or minimark), visiting elements that could reference assets
 */
export function walkBody (body: any, callback: (node: ElementView) => void) {
  if (!body || typeof body !== 'object') {
    return
  }
  if (body.type === 'minimark' && Array.isArray(body.value)) {
    walkMinimark(body.value, callback)
  }
  else if (Array.isArray(body.children)) {
    walkHast(body.children, callback)
  }
}

/**
 * Whether to process, traverse or skip an element
 */
function classify (tag: string, props: any): 'skip' | 'traverse' | 'process' {
  if (tags.exclude.includes(tag)) {
    return 'skip'
  }
  if (tags.include.includes(tag) || !props) {
    return 'traverse'
  }
  return 'process'
}

/**
 * Walk hast nodes: { type: 'element', tag, props, children }
 */
function walkHast (nodes: any[], callback: (node: ElementView) => void) {
  for (const node of nodes) {
    if (!node || node.type !== 'element') {
      continue
    }
    const action = classify(node.tag, node.props)
    if (action === 'skip') {
      continue
    }
    if (action === 'process') {
      callback(node)
    }
    if (Array.isArray(node.children)) {
      walkHast(node.children, callback)
    }
  }
}

/**
 * Walk minimark nodes: [tag, props, ...children] | string
 */
function walkMinimark (nodes: any[], callback: (node: ElementView) => void) {
  for (const node of nodes) {
    if (!Array.isArray(node)) {
      continue
    }
    const [tag, props, ...children] = node
    const action = classify(tag, props)
    if (action === 'skip') {
      continue
    }
    if (action === 'process') {
      callback({ tag, props })
    }
    walkMinimark(children, callback)
  }
}

const tags = {
  // unlikely to contain assets
  exclude: matchTokens({
    container: 'pre code code-inline',
    formatting: 'acronym abbr address bdi bdo big center cite del dfn font ins kbd mark meter progress q rp rt ruby s samp small strike sub sup time tt u var wbr',
    controls: 'input textarea button select optgroup option label legend datalist output',
    media: 'map area canvas svg',
    other: 'style script noscript template',
    empty: 'hr br',
  }),

  // may contain assets
  include: matchTokens({
    content: 'main header footer section article aside details dialog summary data object nav blockquote div span p',
    headers: 'h1 h2 h3 h4 h5 h6',
    table: 'table caption th tr td thead tbody tfoot col colgroup',
    media: 'figcaption figure picture',
    form: 'form fieldset',
    list: 'ul ol li dir dl dt dd',
    formatting: 'strong b em i',
  }),
}
