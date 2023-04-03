import Path from 'path'
import { visit } from 'unist-util-visit'
import { NitroApp } from 'nitropack'
import { isValidAsset, walk } from './utils'
import { tags } from './options'

// @ts-ignore – options injected via module.ts
import { assets, sources } from '#nuxt-content-assets'

/**
 * Return an absolute path to a content article
 *
 * @param id        Nuxt Content file id
 */
function getDocPath (id: string) {
  const parts = id.split(':')
  const key = parts.shift()
  const relPath = parts.join('/')
  const absBase = sources[key]
  return Path.join(absBase, relPath)
}

/**
 * Get asset config based on absolute path
 *
 * @param absDoc    Absolute document path
 * @param relAsset  Relative image path
 */
function getAsset (absDoc: string, relAsset: string) {
  const absAsset = Path.join(Path.dirname(absDoc), relAsset)
  return assets[absAsset] || {}
}

export default defineNitroPlugin(async (nitroApp: NitroApp) => {
  nitroApp.hooks.hook('content:file:afterParse', async (file) => {
    if (file._id.endsWith('.md')) {
      // location
      const absDoc = getDocPath(file._id)

      // walk front matter
      const filter = (value: any, key?: string | number) => !(String(key).startsWith('_') || key === 'body')
      walk(file, (value: any, parent: any, key: any) => {
        if (isValidAsset(value)) {
          const { rel } = getAsset(absDoc, value)
          if (rel) {
            parent[key] = rel
          }
        }
      }, filter)

      // walk body
      visit(file.body, (n: any) => tags.includes(n.tag), (node) => {
        // media
        if (node.props.src) {
          const { rel, width, height } = getAsset(absDoc, node.props.src)
          if (rel) {
            node.props.src = rel
          }
          if (width && height) {
            node.props.width = width
            node.props.height = height
          }
        }

        // links not currently supported
        else if (node.tag === 'a') {
          if (node.props.href) {
            const { rel } = getAsset(absDoc, node.props.href)
            if (rel) {
              node.props.href = rel
              node.props.target = '_blank'
            }
          }
        }
      })
    }
  })
})
