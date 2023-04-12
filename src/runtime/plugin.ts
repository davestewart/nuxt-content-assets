import Path from 'path'
import { visit } from 'unist-util-visit'
import type { NitroApp, NitroAppPlugin } from 'nitropack'
import { deKey, isValidAsset, toPath, walk } from './utils'
import { tags } from './options'

// @ts-ignore – options injected via module.ts
import { cachePath } from '#nuxt-content-assets'
import { makeStorage } from './services'
import type { AssetConfig } from './services'

// ---------------------------------------------------------------------------------------------------------------------
// assets
// ---------------------------------------------------------------------------------------------------------------------

async function updateAssets () {
  assets = await storage.getItem('assets.json') as Record<string, AssetConfig>
  // console.log(`Assets has ${Object.values(assets).length} keys}!`)
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
      visit(file.body, (n: any) => tags.includes(n.tag), (node) => {
        // media
        if (node.props.src) {
          const { srcAttr, width, height, ratio } = getAsset(srcDoc, node.props.src)
          if (srcAttr) {
            node.props.src = srcAttr
            if (width && height) {
              node.props.width = width
              node.props.height = height
            }
            if (ratio) {
              node.props.style = `aspect-ratio:${ratio}`
            }
          }
        }

        // links
        else if (node.tag === 'a') {
          if (node.props.href) {
            const { srcAttr } = getAsset(srcDoc, node.props.href)
            if (srcAttr) {
              node.props.href = srcAttr
              node.props.target = '_blank'
            }
          }
        }
      })
    }
  })
}

export default plugin
