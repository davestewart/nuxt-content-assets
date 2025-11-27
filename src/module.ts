import * as Fs from 'fs'
import Path from 'crosspath'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { isImage, list, log, warn, makeIgnores, matchTokens, removeEntry, toPath } from './runtime/utils'
import { setupSocketServer } from './build/sockets/setup'
import { makeSourceManager } from './runtime/assets/source'
import { makeAssetsManager } from './runtime/assets/public'
import { rewriteContent } from './runtime/content/parsed'
import type { ModuleMeta, Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { MountOptions } from '@nuxt/content'
import type { ImageSize, ModuleOptions } from './types'

const resolve = createResolver(import.meta.url).resolve

const meta: ModuleMeta = {
  name: 'nuxt-content-assets',
  configKey: 'contentAssets',
  compatibility: {
    nuxt: '>=4.0.0',
  },
}

export default defineNuxtModule<ModuleOptions>({
  meta,

  defaults: {
    imageSize: '',
    contentExtensions: 'mdx? csv ya?ml json',
    debug: false,
  },

  async setup (options: ModuleOptions, nuxt: Nuxt) {
    // ---------------------------------------------------------------------------------------------------------------------
    // paths
    // ---------------------------------------------------------------------------------------------------------------------

    // nuxt build folder (.nuxt)
    const buildPath = nuxt.options.buildDir

    // node modules folder (note: from v1.4.1 the assets cache moved from .nuxt/... to node_modules/... @see #76)
    const modulesPath = nuxt.options.modulesDir.find((path: string) => Fs.existsSync(`${path}/nuxt-content-assets/cache`)) || ''
    if (!modulesPath) {
      warn('Unable to find cache folder!')
      if (nuxt.options.rootDir.endsWith('/playground')) {
        warn('Run "npm run dev:setup" to generate a new cache folder')
      }
    }

    // assets cache (node_modules/nuxt-content-assets/cache)
    const cachePath = modulesPath
      ? Path.resolve(modulesPath, 'nuxt-content-assets/cache')
      : Path.resolve(buildPath, 'content-assets') // TODO check if fallback even works?

    // public folder (node_modules/nuxt-content-assets/cache/public)
    const publicPath = Path.join(cachePath, 'public')

    // content cache (.nuxt/content-cache)
    const contentPath = Path.join(buildPath, 'content-cache')

    // ---------------------------------------------------------------------------------------------------------------------
    // setup
    // ---------------------------------------------------------------------------------------------------------------------

    // options
    const isDev = !!nuxt.options.dev
    const isDebug = !!options.debug

    // clear caches
    if (isDebug) {
      log('Cleaning content-cache')
      log(`Cache path: "${Path.relative(".", cachePath)}"`)
    }

    // clear cached markdown so image paths get updated
    removeEntry(contentPath)

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    // set up content ignores
    const { contentExtensions } = options
    if (contentExtensions) {
      // @ts-ignore
      nuxt.options.content ||= {}
      if (nuxt.options.content) {
        nuxt.options.content.ignores ||= []
      }
      const ignores = makeIgnores(contentExtensions)
      nuxt.options.content?.ignores.push(ignores)
    }

    // convert image size hints to array
    const imageSizes: ImageSize = matchTokens(options.imageSize) as ImageSize

    // collate sources
    type Sources = Record<string, MountOptions>
    const sources: Sources = Array
      .from(nuxt.options._layers)
      .map((layer: NuxtConfigLayer) => layer.config?.content?.sources)
      .reduce((output: Sources, sources) => {
        if (sources && !Array.isArray(sources)) {
          Object.assign(output, <Sources>sources)
        }
        return output
      }, {})

    // add default content folder
    if (Object.keys(sources).length === 0 || !sources.content) {
      const content = nuxt.options.rootDir + '/content'
      if (Fs.existsSync(content)) {
        sources.content = {
          driver: 'fs',
          base: content,
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // assets
    // ---------------------------------------------------------------------------------------------------------------------

    /**
     * Assets manager
     */
    const assets = makeAssetsManager(publicPath, isDev)

    // clear files from previous run
    assets.init()

    /**
     * Callback for when assets change
     *
     * - if the asset is updated or deleted, we tell the browser to update the asset's properties
     * - if the asset is an image and changes size, we also rewrite the cached content
     *
     * @param event   The type of update
     * @param absTrg  The absolute path to the copied asset
     */
    function onAssetChange (event: 'update' | 'remove', absTrg: string) {
      let src: string = ''
      let width: number | undefined
      let height: number | undefined

      // update
      if (event === 'update') {
        // 1. get the old asset config first...
        const oldAsset = isImage(absTrg) && imageSizes.length
          ? assets.getAsset(absTrg)
          : null

        // 2. ...before the asset overwrites the image size
        const newAsset = assets.setAsset(absTrg)

        // sizes
        width = newAsset.width
        height = newAsset.height

        // check for image size change
        if (oldAsset) {
          // special behaviour for image size change!
          // we rewrite cached content directly so image size changes are permanent
          if (oldAsset.width !== newAsset.width || oldAsset.height !== newAsset.height) {
            newAsset.content.forEach(async (id: string) => {
              const path = Path.join(contentPath, 'parsed', toPath(id))
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
      }
    }

    /**
     * Socket to communicate changes to client
     */
    addPlugin(resolve('./runtime/sockets/plugin'))
    const socket = isDev && nuxt.options.content?.watch !== false
      ? await setupSocketServer('content-assets')
      : null

    // ---------------------------------------------------------------------------------------------------------------------
    // sources
    // ---------------------------------------------------------------------------------------------------------------------

    // create source managers
    const managers: Record<string, ReturnType<typeof makeSourceManager>> = {}
    for (const [key, source] of Object.entries(sources)) {
      // debug
      if (isDebug) {
        log(`Creating source "${key}"`)
      }

      // create manager
      managers[key] = makeSourceManager(key, source, publicPath, onAssetChange)
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // nuxt hooks
    // ---------------------------------------------------------------------------------------------------------------------

    // copy assets to public folder
    nuxt.hook('build:before', async function () {
      for (const [key, manager] of Object.entries(managers)) {
        // copy assets
        const paths = await manager.init()

        // update assets config
        paths.forEach(path => assets.setAsset(path))

        // debug
        if (isDebug) {
          list(`Copied "${key}" assets`, paths.map(path => Path.relative(publicPath, path)))
        }
      }
    })

    // cleanup when nuxt closes
    nuxt.hook('close', async () => {
      await assets.dispose()
      for (const key in managers) {
        await managers[key]?.dispose()
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
      makeVar('imageSizes', imageSizes),
      makeVar('debug', isDebug),
    ].join('\n')

    // setup server plugin
    nuxt.hook('nitro:config', async (config) => {
      // add plugin
      config.plugins ||= []
      config.plugins.push(pluginPath)

      // make config available to nitro
      config.virtual ||= {}
      config.virtual[`#${meta.name}`] = () => {
        return virtualConfig
      }

      // serve public assets
      config.publicAssets ||= []
      config.publicAssets.push({
        dir: publicPath,
        maxAge: (60 * 60 * 24) * 7, // 7 days
      })
    })
  },
})
