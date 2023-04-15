import * as Fs from 'fs'
import * as Path from 'path'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { MountOptions } from '@nuxt/content'
import { Nuxt } from '@nuxt/schema'
import debounce from 'debounce'
import type { AssetConfig, SourceManager } from './runtime/services'
import { getAssetPaths, getAssetSizes, makeSourceManager } from './runtime/services'
import { list, log, matchTokens, removeFolder, writeFile, } from './runtime/utils'
import { moduleKey, moduleName } from './runtime/config'
import { defaults, getIgnores } from './runtime/options'
import { setupSocketServer } from './build/sockets/setup'

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

    // local paths
    const pluginPath = resolve('./runtime/plugin')

    // build folders
    const buildPath = nuxt.options.buildDir
    const cachePath = Path.join(buildPath, 'content-assets')
    const publicPath = Path.join(cachePath, 'public')
    const indexPath = Path.join(cachePath, 'assets.json')

    // dump to file helper
    // eslint-disable-next-line
    const dump = (name: string, data: any): void => {
      const path = `${cachePath}/debug/${name}.json`
      log(`Dumping "${Path.relative('', path)}"`)
      writeFile(path, data)
    }

    // clear caches
    if (options.debug) {
      log('Removing cache folders...')
    }
    // clear cached markdown so image paths get updated
    removeFolder(Path.join(buildPath, 'content-cache'))

    // clear images from previous run
    removeFolder(cachePath)

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    // @ts-ignore
    // set up content ignores
    nuxt.options.content ||= {}
    if (nuxt.options.content) {
      nuxt.options.content.ignores ||= []
    }
    const ignores = getIgnores(options.contentExtensions)
    nuxt.options.content?.ignores.push(ignores)

    // convert image size hints to array
    const imageFlags = matchTokens(options.imageSize)

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
    // asset setup
    // ---------------------------------------------------------------------------------------------------------------------

    /**
     * Set asset config
     */
    function updateAsset (src: string) {
      // variables
      const { srcRel, srcAttr } = getAssetPaths(publicPath, src)
      const { width, height } = getAssetSizes(src)

      // add assets to config
      assets[srcRel] = {
        srcAttr,
        width,
        height,
      }

      // update
      saveAssets()

      // return
      return srcAttr
    }

    /**
     * Remove asset config
     */
    function removeAsset (src: string) {
      const { srcRel, srcAttr } = getAssetPaths(publicPath, src)
      delete assets[srcRel]
      saveAssets()
      return srcAttr
    }

    /**
     * Debounced handler to save assets config
     */
    const saveAssets = debounce(() => {
      writeFile(indexPath, assets)
    }, 50)

    /**
     * Asset data
     */
    const assets: Record<string, AssetConfig> = {}

    // ---------------------------------------------------------------------------------------------------------------------
    // asset reloading
    // ---------------------------------------------------------------------------------------------------------------------

    /**
     * Callback for when assets change
     */
    function onAssetChange (event: 'update' | 'remove', absTrg: string) {
      const src = event === 'update'
        ? updateAsset(absTrg)
        : removeAsset(absTrg)
      if (socket) {
        socket.send({ event, src })
      }
    }

    // asset live reload
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
        paths.forEach(path => updateAsset(path))

        // debug
        if (options.debug) {
          list(`Copied "${key}" assets`, paths.map(path => Path.relative(publicPath, path)))
        }
      }
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // nitro hook
    // ---------------------------------------------------------------------------------------------------------------------

    // build config
    const makeVar = (name: string, value: any) => `export const ${name} = ${JSON.stringify(value)};`
    const virtualConfig = [
      makeVar('cachePath', cachePath),
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
