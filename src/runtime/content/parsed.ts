import type { AssetConfig, ParsedContent } from '../../types'
import { walkBody, walkMeta, buildQuery, readFile, writeFile } from '../utils'

/**
 * Rewrite cached content with updated image sizes
 */
export function rewriteContent (path: string, asset: AssetConfig): ParsedContent {
  // load content
  const { parsed }: ParsedContent = readFile(path, true)

  // get asset properties
  const { srcAttr, width, height } = asset

  // walk meta
  walkMeta(parsed, (value, parent, key) => {
    if (value.startsWith(srcAttr)) {
      parent[key] = parent[key].replace(/width=\d+&height=\d+/, `width=${width}&height=${height}`)
    }
  })

  // walk body
  walkBody(parsed, function (node: any) {
    const { tag, props } = node
    if (tag === 'img' && props?.src?.startsWith(srcAttr)) {
      props.src = buildQuery(srcAttr, `time=${Date.now()}`)
      if (props.width) {
        props.width = width
      }
      if (props.height) {
        props.height = height
      }
      if (props.style) {
        const ratio = `${width}/${height}`
        if (typeof props.style === 'string') {
          props.style = props.style.replace(/aspect-ratio: \d+\/\d+/, `aspect-ratio: ${ratio}`)
        }
        else if (props.style.aspectRatio) {
          props.style.aspectRatio = ratio
        }
      }
    }
  })

  // save file
  writeFile(path, { module: true, parsed })

  // return
  return parsed
}
