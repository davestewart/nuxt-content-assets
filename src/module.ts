import * as Fs from 'fs'
import * as Path from 'path'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { MountOptions } from '@nuxt/content'
import { Nuxt } from '@nuxt/schema'
import type { SourceManager } from './runtime/assets/source'
import {
  log,
  list,
  isImage,
  makeIgnores,
  matchTokens,
  removeFolder,
  toPath,
} from './runtime/utils'
import { defaults } from './runtime/options'
import { moduleKey, moduleName } from './runtime/config'
import { setupSocketServer } from './build/sockets/setup'
import { makeSourceManager } from './runtime/assets/source'
import { makeAssetsManager } from './runtime/assets/public'
import { rewriteContent } from './runtime/content/parsed'
import { ImageSize } from './types'

const resolve = createResolver(import.meta.url).resolve

export interface ModuleOptions {
  imageSize?: string | string[] | false
  contentExtensions: string | string[],
  debug?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: moduleName,
    configKey: moduleKey,
    compatibility: {
      nuxt: '^3.0.0'
    }
  },

  defaults,

  async setup (options, nuxt: Nuxt) {
    // ---------------------------------------------------------------------------------------------------------------------
    // setup
    // ---------------------------------------------------------------------------------------------------------------------

    // build folders
    const buildPath = nuxt.options.buildDir
    const assetsPath = Path.join(buildPath, 'content-assets')
    const publicPath = Path.join(assetsPath, 'public')

    // cached content
    const contentPath = Path.join(buildPath, 'content-cache/parsed')

    // clear caches
    if (options.debug) {
      log('Removing cache folders...')
    }
    // clear cached markdown so image paths get updated
    removeFolder(Path.join(buildPath, 'content-cache'))

    // clear images from previous run
    removeFolder(assetsPath)

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    // @ts-ignore
    // set up content ignores
    nuxt.options.content ||= {}
    if (nuxt.options.content) {
      nuxt.options.content.ignores ||= []
    }
    const ignores = makeIgnores(options.contentExtensions)
    nuxt.options.content?.ignores.push(ignores)

    // convert image size hints to array
    const imageFlags: ImageSize = matchTokens(options.imageSize) as ImageSize

    // collate sources
    const sources: Record<string, MountOptions> = nuxt.options._layers
      // @ts-ignore
      .map(layer => layer.config?.content?.sources)
      .reduce((output, sources) => {
        if (sources) {
          Object.assign(output, sources)
        }
        return output
      }, {})

    // add default content folder
    if (Object.keys(sources).length === 0 || !sources.content) {
      const content = nuxt.options.srcDir + '/content'
      if (Fs.existsSync(content)) {
        sources.content = {
          driver: 'fs',
          base: content
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // assets
    // ---------------------------------------------------------------------------------------------------------------------

    /**
     * Assets manager
     */
    const assets = makeAssetsManager(publicPath)

    /**
     * Callback for when assets change
     *
     * - if the asset is updated or deleted, we tell the browser to update the asset's properties
     * - if the asset is an image and changes size, we potentially rewrite the cached content
     *
     * @param event   The type of update
     * @param absTrg  The absolute path to the copied asset
     */
    function onAssetChange (event: 'update' | 'remove', absTrg: string) {
      let src: string = ''
      let width: number | undefined
      let height: number | undefined
      let resize = false

      // update
      if (event === 'update') {
        // 1. the old asset
        const oldAsset = isImage(absTrg) && imageFlags.length
          ? assets.getAsset(absTrg)
          : null

        // 1. the new asset; this HAS to go second, as it overwrites image size
        const newAsset = assets.setAsset(absTrg)

        // sizes
        width = newAsset.width
        height = newAsset.height

        // check for image size change
        if (oldAsset) {
          // special behaviour for image size change!
          // we rewrite cached content directly so it displays
          if (oldAsset.width !== newAsset.width || oldAsset.height !== newAsset.height) {
            resize = true
            newAsset.content.forEach(async (id: string) => {
              const path = Path.join(contentPath, toPath(id))
              rewriteContent(path, newAsset)
            })
          }
        }

        // set src
        src = newAsset.srcAttr
      }

      // remove
      else {
        const asset = assets.removeAsset(absTrg)
        if (asset) {
          src = asset.srcAttr
        }
      }

      // sockets
      if (src && socket) {
        socket.send({ event, src, width, height })
        if (resize) {
          // socket.send({ event: 'refresh' })
        }
      }
    }

    /**
     * Socket to communicate changes to client
     */
    addPlugin(resolve('./runtime/sockets/plugin'))
    const socket = nuxt.options.dev
      ? await setupSocketServer('content-assets')
      : null

    // ---------------------------------------------------------------------------------------------------------------------
    // sources setup
    // ---------------------------------------------------------------------------------------------------------------------

    // create source managers
    const managers: Record<string, SourceManager> = {}
    for (const [key, source] of Object.entries(sources)) {
      // debug
      if (options.debug) {
        log(`Creating source "${key}"`)
      }

      // create manager
      managers[key] = makeSourceManager(key, source, publicPath, onAssetChange)
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // build hook
    // ---------------------------------------------------------------------------------------------------------------------

    // copy assets to public folder
    nuxt.hook('build:before', async function () {
      for (const [key, manager] of Object.entries(managers)) {
        // copy assets
        const paths = await manager.init()

        // update assets config
        paths.forEach(path => assets.setAsset(path))

        // debug
        if (options.debug) {
          list(`Copied "${key}" assets`, paths.map(path => Path.relative(publicPath, path)))
        }
      }
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // nitro hook
    // ---------------------------------------------------------------------------------------------------------------------

    // plugin
    const pluginPath = resolve('./runtime/content/plugin')

    // config
    const makeVar = (name: string, value: any) => `export const ${name} = ${JSON.stringify(value)};`
    const virtualConfig = [
      makeVar('publicPath', publicPath),
      makeVar('imageFlags', imageFlags),
      makeVar('debug', options.debug),
    ].join('\n')

    // setup server plugin
    nuxt.hook('nitro:config', async (config) => {
      // add plugin
      config.plugins ||= []
      config.plugins.push(pluginPath)

      // make config available to nitro
      config.virtual ||= {}
      config.virtual[`#${moduleName}`] = () => {
        return virtualConfig
      }

      // serve public assets
      config.publicAssets ||= []
      config.publicAssets.push({
        dir: publicPath,
        // maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    })
  },
})
