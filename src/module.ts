import * as Fs from 'fs'
import * as Path from 'path'
import { addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import { MountOptions } from '@nuxt/content'
import { Nuxt } from '@nuxt/schema'
import { AssetConfig, getAssetConfig, interpolatePattern, getFsAssets, getGithubAssets } from './runtime/services'
import { moduleKey, moduleName } from './runtime/config'
import { defaults, extensions } from './runtime/options'
import { copyFile, list, log, matchWords, removeFolder, writeFile, } from './runtime/utils'

const resolve = createResolver(import.meta.url).resolve

export interface ModuleOptions {
  output?: string
  additionalExtensions?: string
  extensions?: string
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
    extensions: '',
    additionalExtensions: '',
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
    const tempPath = Path.resolve('node_modules/.nuxt-content-assets')

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
    // ensures markdown image paths get replaced
    removeFolder(Path.join(buildPath, 'content-cache'))

    // clear images from previous run
    removeFolder(cachePath)
    removeFolder(tempPath)

    // @ts-ignore
    // set up content ignores
    nuxt.options.content ||= {}
    if (nuxt.options.content) {
      nuxt.options.content.ignores ||= []
    }

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

    // assign extensions
    if (options.extensions?.trim()) {
      extensions.splice(0, extensions.length, ...matchWords(options.extensions))
    }
    else if (options.additionalExtensions) {
      extensions.push(...matchWords(options.additionalExtensions))
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // assets
    // ---------------------------------------------------------------------------------------------------------------------

    // debug
    if (options.debug) {
      log('Preparing sources...')
    }

    // store asset data
    const assets: Record<string, { src: string, trg: string, config: Partial<AssetConfig> }> = {}

    // collate content folders
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

    // process sources
    for (const [key, source] of Object.entries(sources)) {
      // folder
      const { driver } = source
      let srcDir: string = ''

      // get all images
      let paths: string[] = []
      switch (driver) {
        case 'fs':
          paths = getFsAssets(source.base, extensions)
          srcDir = source.base
          break

        case 'github':
          paths = await getGithubAssets(key, source as any, tempPath, extensions)
          srcDir = Path.join(tempPath, key)
          break
      }

      // debug
      if (options.debug) {
        log(`Prepared ${paths.length} paths for source "${key}"`)
      }

      // build assets map
      if (paths.length) {
        // build asset configs
        paths.forEach((src: string) => {
          // get asset
          const {
            id,
            srcRel,
            srcAttr,
            width,
            height,
            ratio,
            query
          } = getAssetConfig(srcDir, src, assetsPattern, imageFlags)

          // tell content to ignore file
          // @ts-ignore
          nuxt.options.content.ignores.push(id)

          // target file path
          const trg = Path.join(publicPath, assetsDir, srcAttr)

          // add assets to config
          assets[srcRel] = {
            src,
            trg,
            config: {
              srcAttr: Path.join(assetsDir, srcAttr),
              width,
              height,
              ratio,
              query
            }
          }
        })
      }
    }

    nuxt.hook('build:before', function () {
      // debug
      if (options.debug) {
        dump('assets', assets)
      }

      // debug
      if (options.debug) {
        log(`Copying ${Object.keys(assets).length} assets...`)
      }

      // loop over all assets and copy
      const copied: string[] = []
      const failed: string[] = []
      for (const [key, { src, trg }] of Object.entries(assets)) {
        if (Fs.existsSync(src)) {
          copyFile(src, trg)
          copied.push(key)
        }
        else {
          failed.push(key)
        }
      }

      // debug
      if (options.debug) {
        if (copied.length) {
          list('Copied', copied)
        }
        if (failed.length) {
          list('Failed to copy', failed)
        }
      }
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // nitro plugin
    // ---------------------------------------------------------------------------------------------------------------------

    // convert assets for nitro
    const nitroAssets = Object.entries(assets).reduce((output, [key, value]) => {
      output[key] = value.config
      return output
    }, {} as any)

    // build config
    const virtualConfig = [
      `export const assets = ${JSON.stringify(nitroAssets, null, '  ')}`,
    ].join('\n')

    // make config available to nuxt
    // see https://discord.com/channels/473401852243869706/1075789688188698685/1075792884957192334
    nuxt.options.alias[`#${moduleName}`] = addTemplate({
      filename: `${moduleName}.mjs`,
      getContents: () => virtualConfig,
    }).dst

    // setup server plugin
    nuxt.hook('nitro:config', async (config) => {
      // add plugin
      config.plugins ||= []
      config.plugins.push(pluginPath)

      // make config available to nitro
      config.virtual ||= {}
      config.virtual[`#${moduleName}`] = virtualConfig

      // serve public assets
      config.publicAssets ||= []
      config.publicAssets.push({
        dir: publicPath,
        // maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    })
  },
})
