import type { NitroApp, NitroAppPlugin } from 'nitropack'
import type { ImageSize, ParsedContent, ResolvedAsset } from '../../types'
import { buildQuery, buildStyle, list, setContentExtensions, walkBody, walkMeta } from '../utils'
import { makeAssetResolver } from '../assets/resolver'
import { contentExtensions, debug, imageSizes, publicPath, srcset } from '#nuxt-content-assets'

const plugin: NitroAppPlugin = (nitro: NitroApp) => {
  // configure which extensions count as content (mirrors the build process)
  setContentExtensions(contentExtensions)

  // resolver
  const resolver = makeAssetResolver(publicPath, {
    watch: import.meta.dev,
    srcset,
  })

  /**
   * Walk the parsed frontmatter and check properties as paths
   */
  function processMeta (content: ParsedContent, imageSizes: ImageSize, updated: string[]) {
    walkMeta(content, (value, parent, key) => {
      const asset = resolver.resolve(content, value)
      if (asset) {
        const { srcAttr, width, height } = asset
        const srcUrl = width && height && imageSizes.includes('src')
          ? buildQuery(srcAttr, `width=${width}&height=${height}`)
          : srcAttr
        parent[key] = srcUrl
        updated.push(`meta: ${key} to "${srcUrl}"`)
      }
    })
  }

  /**
   * Walk the parsed content and check potential attributes as paths
   */
  function processBody (content: ParsedContent, imageSizes: ImageSize, updated: string[]) {
    walkBody(content, (node: any) => {
      const { tag, props } = node
      for (const [prop, value] of Object.entries(props)) {
        const asset = resolver.resolve(content, value)
        if (asset) {
          props[prop] = asset.srcAttr
          if (tag === 'img' || tag === 'nuxt-img') {
            applyImageHints(node, asset, imageSizes)
          }
          else if (tag === 'a') {
            props.target ||= '_blank'
          }
          updated.push(`page: ${tag}[${prop}] to "${asset.srcAttr}"`)
        }
      }
    })
  }

  /**
   * Add size and srcset hints to image nodes
   */
  function applyImageHints (node: any, asset: ResolvedAsset, imageSizes: ImageSize) {
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
    if (node.tag === 'img' && asset.srcset && !props.srcset) {
      props.srcset = asset.srcset
      if (asset.sizes && !props.sizes) {
        props.sizes = asset.sizes
      }
    }
  }

  // @ts-expect-error hook is added by Nuxt Content
  nitro.hooks.hook('content:file:afterParse', async (content: ParsedContent) => {
    if (content._extension === 'md') {
      await resolver.ready
      const updated: string[] = []
      processMeta(content, imageSizes, updated)
      processBody(content, imageSizes, updated)
      if (debug && updated.length) {
        list(`Processed "/${content._file}"`, updated)
      }
    }
  })

  nitro.hooks.hook('close', resolver.dispose)
}

export default plugin
