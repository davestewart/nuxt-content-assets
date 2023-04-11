import * as Fs from 'fs'
import * as Path from 'path'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import { MountOptions } from '@nuxt/content'
import { Nuxt } from '@nuxt/schema'
import debounce from 'debounce'
import type { AssetConfig, SourceManager } from './runtime/services'
import { getAssetConfig, interpolatePattern, makeSourceManager } from './runtime/services'
import { Callback, list, log, matchWords, removeFolder, writeFile, } from './runtime/utils'
import { moduleKey, moduleName } from './runtime/config'
import { defaults } from './runtime/options'
import { useSocketServer } from './runtime/services/sockets/server'

const resolve = createResolver(import.meta.url).resolve

export interface ModuleOptions {
  output?: string
  imageSize?: string
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

  defaults: {
    output: `${defaults.assetsDir}/${defaults.assetsPattern}`,
    imageSize: '',
    debug: false,
  },

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

    // @ts-ignore
    // set up content ignores
    nuxt.options.content ||= {}
    if (nuxt.options.content) {
      nuxt.options.content.ignores ||= []
    }
    nuxt.options.content?.ignores.push('^((?!(md|json|yaml|csv)).)*$')

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    // generate assets patterns
    const output = options.output || defaults.assetsDir
    const matches = output.match(/([^[]+)(.*)?/)
    const assetsDir = matches
      ? matches[1].replace(/^\/*/, '/').replace(/\/*$/, '')
      : defaults.assetsDir
    const assetsPattern = (matches ? matches[2] : '')
      || defaults.assetsPattern

    // test asset pattern for invalid tokens
    interpolatePattern(assetsPattern, '', true)

    // convert image size hints to array
    const imageFlags = matchWords(options.imageSize)

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
    // image reloading
    // ---------------------------------------------------------------------------------------------------------------------

    addPlugin(resolve('./runtime/watcher'))
    const socket = nuxt.options.dev
      ? useSocketServer(nuxt as any, 'content-assets')
      : null

    // ---------------------------------------------------------------------------------------------------------------------
    // sources setup
    // ---------------------------------------------------------------------------------------------------------------------

    /**
     * Remove asset config
     */
    function removeAsset (src: string) {
      const srcRel = Path.relative(publicPath, src)
      delete assets[srcRel]
      saveAssets()
      return '/' + srcRel
    }

    /**
     * Set asset config
     */
    function updateAsset (src: string) {
      // get asset
      const {
        srcRel,
        srcAttr,
        width,
        height,
        ratio,
        query
      } = getAssetConfig(publicPath, src, assetsPattern, imageFlags)

      // add assets to config
      assets[srcRel] = {
        srcRel,
        srcAttr,
        width,
        height,
        ratio,
        query
      }

      // update
      saveAssets()

      // return
      return srcAttr
    }

    /**
     * Callback for when assets change
     */
    function watchAsset (event: 'update' | 'remove', absTrg: string) {
      const srcAttr = event === 'update'
        ? updateAsset(absTrg)
        : removeAsset(absTrg)
      if (socket) {
        socket.send({ event: 'update', src: srcAttr })
      }
    }

    /**
     * Debounced handler to save assets config
     */
    const saveAssets = debounce(() => {
      writeFile(indexPath, assets)
    }, 50)

    // store asset data
    const assets: Record<string, AssetConfig> = {}

    // create source managers
    const managers: Record<string, SourceManager> = {}
    for (const [key, source] of Object.entries(sources)) {
      // debug
      if (options.debug) {
        log(`Creating source "${key}"`)
      }

      // create manager
      managers[key] = makeSourceManager(key, source, publicPath, watchAsset)
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
    const virtualConfig = [
      // `export const assets = ${JSON.stringify(assets, null, '  ')}`,
      `export const cachePath = '${cachePath}'`,
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
