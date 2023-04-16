import { CONTINUE, SKIP, visit } from 'unist-util-visit'
import type { NitroApp, NitroAppPlugin } from 'nitropack'
import type { ParsedContent } from '../../types'
import { buildQuery, buildStyle, isValidAsset, list, matchTokens, parseQuery, removeQuery, walk } from '../utils'
import { makeAssetsManager } from './cache'

// @ts-ignore – options injected via module.ts
import { cachePath, debug, imageFlags, publicPath } from '#nuxt-content-assets'

// ---------------------------------------------------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------------------------------------------------

const { getDocumentAsset } = makeAssetsManager(cachePath, publicPath)

export const tags = {
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

// ---------------------------------------------------------------------------------------------------------------------
// plugin
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Walk the parsed frontmatter and check properties as paths
 */
function processMeta (content: ParsedContent, updated: string[]) {
  const filter = (value: any, key?: string | number) => !(String(key).startsWith('_') || key === 'body')
  walk(content, (value: any, parent: any, key: any) => {
    if (isValidAsset(value)) {
      const { srcAttr, width, height } = getDocumentAsset(content._file, removeQuery(value), true)
      if (srcAttr) {
        const query = width && height && (imageFlags.includes('src') || imageFlags.includes('url'))
          ? `width=${width}&height=${height}`
          : ''
        const srcUrl = query
          ? buildQuery(srcAttr, parseQuery(value), query)
          : srcAttr
        parent[key] = srcUrl
        updated.push(`meta: ${key} to "${srcUrl}"`)
      }
    }
  }, filter)
}

/**
 * Walk the parsed content and check potential attributes as paths
 */
function processBody (content: ParsedContent, updated: string[]) {
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

    // process attributes of everything else!
    for (const [prop, value] of Object.entries(props)) {
      // only process strings
      if (typeof value !== 'string') {
        return
      }

      // parse value
      const { srcAttr, width, height } = getDocumentAsset(content._file, value, true)

      // if we resolved an asset
      if (srcAttr) {
        // assign src
        node.props[prop] = srcAttr

        // assign size
        if (node.tag === 'img') {
          if (width && height) {
            if (imageFlags.includes('attrs')) {
              node.props.width ||= width
              node.props.height ||= height
            }
            if (imageFlags.includes('style')) {
              const ratio = `${width}/${height}`
              if (typeof node.props.style === 'string') {
                node.props.style = buildStyle(node.props.style, `aspect-ratio: ${ratio}`)
              }
              else {
                node.props.style ||= {}
                node.props.style.aspectRatio = ratio
              }
            }
          }
        }

        // open links in new window
        else if (node.tag === 'a') {
          node.props.target ||= '_blank'
        }

        // debug
        updated.push(`page: ${tag}[${prop}] to "${srcAttr}"`)
      }
    }
  })
}

async function processContent (content: ParsedContent) {
  // debug
  // console.log('Processing:', srcDoc)

  if (content._extension === 'md') {
    // process
    const updated: string[] = []
    processMeta(content, updated)
    processBody(content, updated)

    // debug
    if (debug && updated.length) {
      list(`Processed "/${content._file}"`, updated)
      console.log()
    }
  }
}

const plugin: NitroAppPlugin = async (nitro: NitroApp) => {
  nitro.hooks.hook('content:file:afterParse', processContent)
}

export default plugin
