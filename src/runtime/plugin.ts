import Path from 'path'
import { visit, SKIP, CONTINUE } from 'unist-util-visit'
import type { NitroApp, NitroAppPlugin } from 'nitropack'
import {
  buildStyle,
  deKey,
  isValidAsset,
  list,
  matchTokens,
  toPath,
  walk,
  removeQuery,
  buildQuery,
  parseQuery
} from './utils'

// @ts-ignore – options injected via module.ts
import { debug, cachePath } from '#nuxt-content-assets'
import { makeStorage } from './services'
import type { AssetConfig } from './services'

// ---------------------------------------------------------------------------------------------------------------------
// assets
// ---------------------------------------------------------------------------------------------------------------------

async function updateAssets () {
  assets = await storage.getItem('assets.json') as Record<string, AssetConfig>
}

// storage
const storage = makeStorage(cachePath)
storage.watch(async (event: string, key: string) => {
  if (event === 'update' && key === 'assets.json') {
    await updateAssets()
  }
})

// assets
let assets: Record<string, AssetConfig> = {}
void updateAssets()

// ---------------------------------------------------------------------------------------------------------------------
// plugin
// ---------------------------------------------------------------------------------------------------------------------

// tags filters
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

const plugin: NitroAppPlugin = async (nitro: NitroApp) => {
  nitro.hooks.hook('content:file:afterParse', async (file) => {
    const { _id } = file
    if (_id.endsWith('.md')) {
      // location
      const srcDoc = toPath(deKey(_id))
      const srcDir = Path.dirname(srcDoc)
      const updated: string[] = []

      // helper
      const getAsset = (relAsset: string) => {
        const srcAsset = Path.join(srcDir, relAsset)
        return assets[srcAsset] || {}
      }

      // debug
      // console.log('Processing:', srcDoc)

      // walk meta
      const filter = (value: any, key?: string | number) => !(String(key).startsWith('_') || key === 'body')
      walk(file, (value: any, parent: any, key: any) => {
        if (isValidAsset(value)) {
          const { srcAttr, query } = getAsset(removeQuery(value))
          if (srcAttr) {
            const srcUrl = query
              ? buildQuery(srcAttr, parseQuery(value), query)
              : srcAttr
            parent[key] = srcUrl
            updated.push(`meta: ${key} to "${srcUrl}"`)
          }
        }
      }, filter)

      // walk body
      visit(file.body, (node: any) => node.type === 'element', (node) => {
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
          const { srcAttr, width, height, ratio } = getAsset(value)

          // if we resolved an asset
          if (srcAttr) {
            // assign src
            node.props[prop] = srcAttr

            // assign size
            if (node.tag === 'img') {
              if (width && height) {
                node.props.width ||= width
                node.props.height ||= height
              }
              if (ratio) {
                if (typeof node.props.style === 'string') {
                  node.props.style = buildStyle(node.props.style, `aspect-ratio: ${ratio}`)
                }
                else {
                  node.props.style ||= {}
                  node.props.style.aspectRatio = ratio
                }
              }
            }

            // open links in new window
            if (node.tag === 'a') {
              node.props.target ||= '_blank'
            }

            // debug
            updated.push(`page: ${tag}[${prop}] to "${srcAttr}"`)
          }
        }
      })

      // debug
      if (debug && updated.length) {
        list(`Processed "/${srcDoc}"`, updated)
        console.log()
      }
    }
  })
}

export default plugin
