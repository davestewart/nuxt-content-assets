import type { AssetConfig, ParsedContent } from '../../types'
import { buildQuery, exists, parseQuery, readFile, removeQuery, walkBody, walkMeta, writeFile } from '../utils'

/**
 * Rewrite a cached document with updated image sizes
 *
 * @param path    The absolute path to the cached document
 * @param asset   The updated asset
 */
export function rewriteContent (path: string, asset: AssetConfig): ParsedContent | undefined {
  if (!exists(path)) {
    return
  }

  // load content
  const data = readFile<{ parsed: ParsedContent, hash?: string }>(path, true)
  const { parsed } = data
  const { srcAttr, width, height } = asset
  const sizeQuery = `width=${width}&height=${height}`

  // walk meta
  walkMeta(parsed, (value, parent, key) => {
    if (typeof value === 'string' && removeQuery(value) === srcAttr) {
      parent[key] = value.includes('width=')
        ? value.replace(/width=\d+&height=\d+/, sizeQuery)
        : value
    }
  })

  // walk body
  walkBody(parsed, (node: any) => {
    const { tag, props } = node
    if (tag === 'img' && typeof props?.src === 'string' && removeQuery(props.src) === srcAttr) {
      const query = parseQuery(props.src)
        .replace(/[?&]time=\d+/, '')
        .replace(/width=\d+&height=\d+/, sizeQuery)
      props.src = buildQuery(srcAttr, query, `time=${Date.now()}`)
      if (props.width) {
        props.width = width
      }
      if (props.height) {
        props.height = height
      }
      if (props.style) {
        const ratio = `${width}/${height}`
        if (typeof props.style === 'string') {
          props.style = props.style.replace(/aspect-ratio: ?\d+\/\d+/, `aspect-ratio: ${ratio}`)
        }
        else if (props.style.aspectRatio) {
          props.style.aspectRatio = ratio
        }
      }
      if (typeof props.srcset === 'string' && width) {
        const oldWidth = props.srcset.match(new RegExp(`${escapeRegExp(srcAttr)} (\\d+)w`))?.[1]
        props.srcset = props.srcset.replace(new RegExp(`${escapeRegExp(srcAttr)} \\d+w`), `${srcAttr} ${width}w`)
        if (oldWidth && typeof props.sizes === 'string') {
          props.sizes = props.sizes.replaceAll(`${oldWidth}px`, `${width}px`)
        }
      }
    }
  })

  // save file (preserving any other keys, such as Nuxt Content's hash)
  writeFile(path, { ...data, parsed })

  return parsed
}

function escapeRegExp (value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
