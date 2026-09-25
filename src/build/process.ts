import type { ImageSize, ResolvedAsset } from '../types'
import type { AssetIndex } from './assets'
import { type ElementView, buildQuery, buildStyle, walkBody, walkMeta } from '../runtime/utils'

/**
 * Rewrite relative asset paths in a parsed document
 *
 * @param docPath     The absolute path of the source document
 * @param content     The parsed content (mutated in place)
 * @param index       The asset index
 * @param imageSizes  Image size hints to apply
 * @returns           Descriptions of what was updated (for debugging)
 */
export function processContent (docPath: string, content: Record<string, any>, index: AssetIndex, imageSizes: ImageSize): string[] {
  const updated: string[] = []

  // frontmatter and schema fields
  walkMeta(content, (value, parent, key) => {
    const asset = index.resolve(docPath, value)
    if (asset) {
      const { srcAttr, width, height } = asset
      const srcUrl = width && height && imageSizes.includes('src')
        ? buildQuery(srcAttr, `width=${width}&height=${height}`)
        : srcAttr
      parent[key] = srcUrl
      updated.push(`meta: ${String(key)} to "${srcUrl}"`)
    }
  })

  // body and excerpt
  const onElement = (node: ElementView) => {
    const { tag, props } = node
    for (const [prop, value] of Object.entries(props)) {
      const asset = index.resolve(docPath, value)
      if (asset) {
        props[prop] = asset.srcAttr
        if (tag === 'img' || tag === 'nuxt-img') {
          applyImageHints(node, asset, imageSizes)
        }
        else if (tag === 'a') {
          props.target ||= '_blank'
        }
        updated.push(`body: ${tag}[${prop}] to "${asset.srcAttr}"`)
      }
    }
  }
  walkBody(content.body, onElement)
  walkBody(content.excerpt, onElement)

  return updated
}

/**
 * Add size and srcset hints to image elements
 */
function applyImageHints (node: ElementView, asset: ResolvedAsset, imageSizes: ImageSize) {
  const { props } = node
  const { width, height } = asset
  if (width && height) {
    if (imageSizes.includes('attrs')) {
      props.width = width
      props.height = height
    }
    if (imageSizes.includes('style')) {
      const ratio = `${width}/${height}`
      if (typeof props.style === 'string') {
        props.style = buildStyle(props.style, `aspect-ratio: ${ratio}`)
      }
      else {
        props.style ||= {}
        props.style.aspectRatio = ratio
      }
    }
  }
  // only plain images; nuxt-img generates its own srcset
  // note: MDC camel-cases authored attributes, so `{srcset="..."}` arrives as `srcSet`
  if (node.tag === 'img' && asset.srcset && !props.srcset && !props.srcSet) {
    props.srcset = asset.srcset
    if (asset.sizes && !props.sizes) {
      props.sizes = asset.sizes
    }
  }
}
