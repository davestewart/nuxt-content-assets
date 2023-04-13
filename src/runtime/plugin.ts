import Path from 'path'
import { visit } from 'unist-util-visit'
import type { NitroApp, NitroAppPlugin } from 'nitropack'
import { deKey, isValidAsset, toPath, walk } from './utils'

// @ts-ignore – options injected via module.ts
import { cachePath } from '#nuxt-content-assets'
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

/**
 * Get asset config based on absolute path
 *
 * @param srcDoc    Document path
 * @param relAsset  Relative image path
 */
function getAsset (srcDoc: string, relAsset: string) {
  const srcAsset = Path.join(Path.dirname(srcDoc), relAsset)
  return assets[srcAsset] || {}
}

const plugin: NitroAppPlugin = async (nitro: NitroApp) => {
  nitro.hooks.hook('content:file:afterParse', async (file) => {
    if (file._id.endsWith('.md')) {
      // location
      const srcDoc = toPath(deKey(file._id))

      // walk front matter
      const filter = (value: any, key?: string | number) => !(String(key).startsWith('_') || key === 'body')
      walk(file, (value: any, parent: any, key: any) => {
        if (isValidAsset(value)) {
          const { srcAttr, query } = getAsset(srcDoc, value)
          if (srcAttr) {
            parent[key] = srcAttr + (query || '')
          }
        }
      }, filter)

      // walk body
      visit(file.body, (node: any) => node.type === 'element', (node) => {
        for (const [prop, value] of Object.entries(node.props)) {
          if (typeof value !== 'string') {
            return
          }

          // parse value
          const { srcAttr, width, height, ratio } = getAsset(srcDoc, value)

          // if we have an attribute
          if (srcAttr) {
            // assign attribute
            node.props[prop] = srcAttr

            // check for height
            if (width && height) {
              node.props.width = width
              node.props.height = height
            }
            if (ratio) {
              node.props.style = `aspect-ratio:${ratio}`
            }

            // check for links
            if (node.tag === 'a' && !node.props.target) {
              node.props.target = '_blank'
            }
          }
        }
      })
    }
  })
}

export default plugin
