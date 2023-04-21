import type { NitroApp, NitroAppPlugin } from 'nitropack'
import type { ImageSize, ParsedContent } from '../../types'
import { buildQuery, buildStyle, isValidAsset, list, parseQuery, removeQuery, walkBody, walkMeta } from '../utils'
import { makeAssetsManager } from '../assets/public'
// @ts-ignore – options injected via module.ts
import { debug, imageSizes, publicPath } from '#nuxt-content-assets'

/**
 * Walk the parsed frontmatter and check properties as paths
 */
function processMeta (content: ParsedContent, imageSizes: ImageSize = [], updated: string[] = []) {
  walkMeta(content, (value, parent, key) => {
    if (isValidAsset(value)) {
      const { srcAttr, width, height } = resolveAsset(content, removeQuery(value), true)
      if (srcAttr) {
        const query = width && height && (imageSizes.includes('src') || imageSizes.includes('url'))
          ? `width=${width}&height=${height}`
          : ''
        const srcUrl = query
          ? buildQuery(srcAttr, parseQuery(value), query)
          : srcAttr
        parent[key] = srcUrl
        updated.push(`meta: ${key} to "${srcUrl}"`)
      }
    }
  })
}

/**
 * Walk the parsed content and check potential attributes as paths
 */
function processBody (content: ParsedContent, imageSizes: ImageSize = [], updated: string[] = []) {
  walkBody(content, function (node: any) {
    const { tag, props } = node
    for (const [prop, value] of Object.entries(props)) {
      // only process strings
      if (typeof value !== 'string') {
        return
      }

      // parse value
      const { srcAttr, width, height } = resolveAsset(content, value, true)

      // if we resolved an asset
      if (srcAttr) {
        // assign src
        node.props[prop] = srcAttr

        // assign size
        if (node.tag === 'img' || node.tag === 'nuxt-img') {
          if (width && height) {
            if (imageSizes.includes('attrs')) {
              node.props.width = width
              node.props.height = height
            }
            if (imageSizes.includes('style')) {
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

const { resolveAsset } = makeAssetsManager(publicPath)

const plugin: NitroAppPlugin = async (nitro: NitroApp) => {
  nitro.hooks.hook('content:file:afterParse', function (content: ParsedContent) {
    if (content._extension === 'md') {
      const updated: string[] = []
      processMeta(content, imageSizes, updated)
      processBody(content, imageSizes, updated)
      if (debug && updated.length) {
        list(`Processed "/${content._file}"`, updated)
        console.log()
      }
    }
  })
}

export default plugin
