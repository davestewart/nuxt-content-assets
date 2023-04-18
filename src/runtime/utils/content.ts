import { CONTINUE, SKIP, visit } from 'unist-util-visit'
import { ParsedContent } from '../../types'
import { WalkCallback, walk } from './object'
import { matchTokens } from './string'

/**
 * Walk parsed content meta, only processing relevant properties
 *
 * @param content
 * @param callback
 */
export function walkMeta (content: ParsedContent, callback: WalkCallback) {
  walk(content, callback, (value, key) => !(String(key).startsWith('_') || key === 'body'))
}

/**
 * Walk parsed content body, only visiting relevant tags
 *
 * @param content
 * @param callback
 */
export function walkBody (content: ParsedContent, callback: (node: any) => void) {
  visit(content.body, (node: any) => node.type === 'element', (node) => {
    // variables
    const { tag, props } = node

    // skip containers we think won't contain assets
    const excluded = tags.exclude.includes(tag)
    if (excluded) {
      return SKIP
    }

    // traverse containers we think could contain assets
    const included = tags.include.includes(tag)
    if (included || !props) {
      return CONTINUE
    }

    // process node
    return callback(node)
  })
}

const tags = {
  // unlikely to contain assets
  exclude: matchTokens({
    container: 'pre code code-inline',
    formatting: 'acronym abbr address bdi bdo big center cite del dfn font ins kbd mark meter progress q rp rt ruby s samp small strike sub sup time tt u var wbr',
    headers: 'h1 h2 h3 h4 h5 h6',
    controls: 'input textarea button select optgroup option label legend datalist output',
    media: 'map area canvas svg',
    other: 'style script noscript template',
    empty: 'hr br',
  }),

  // may contain assets
  include: matchTokens({
    content: 'main header footer section article aside details dialog summary data object nav blockquote div span p',
    table: 'table caption th tr td thead tbody tfoot col colgroup',
    media: 'figcaption figure picture',
    form: 'form fieldset',
    list: 'ul ol li dir dl dt dd',
    formatting: 'strong b em i',
  }),

  // assets
  assets: 'a img audio source track video embed',
}
