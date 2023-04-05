import { addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import { Nuxt } from '@nuxt/schema'
import getImageSize from 'image-size'
import glob from 'glob'
import * as Fs from 'fs'
import * as Path from 'path'
import { getSources, interpolatePattern, isImage, matchWords, log } from './runtime/utils'
import { moduleKey, moduleName } from './runtime/config'
import { defaults, extensions } from './runtime/options'

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

  setup (options, nuxt: Nuxt) {
    // ---------------------------------------------------------------------------------------------------------------------
    // setup
    // ---------------------------------------------------------------------------------------------------------------------

    // local paths
    const pluginPath = resolve('./runtime/plugin')

    // build folders
    const buildPath = nuxt.options.buildDir
    const cachePath = Path.resolve(buildPath, 'content-assets')

    // clear caches
    if (options.debug) {
      log('Removing cache folders...')
    }
    // ensures markdown image paths get replaced
    Fs.rmSync(Path.join(buildPath, 'content-cache'), { recursive: true, force: true })

    // clear image paths from previous run
    Fs.rmSync(cachePath, { recursive: true, force: true })

    // collate content folders
    const sources = nuxt.options._layers
      .map(layer => layer.config?.content?.sources)
      .reduce((output, sources) => {
        if (sources) {
          Object.assign(output, getSources(sources))
        }
        return output
      }, {})

    // add default content folder
    if (Object.keys(sources).length === 0 || !sources.content) {
      const content = nuxt.options.srcDir + '/content'
      if (Fs.existsSync(content)) {
        sources.content = content
      }
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    // generate assets patterns
    const output = options.output || defaults.assetsDir
    const matches = output.match(/([^[]+)(.*)?/)
    const assetsDir = matches ? matches[1] : defaults.assetsDir
    const assetsPattern = (matches ? matches[2] : '') || defaults.assetsPattern

    // test asset pattern for invalid tokens
    interpolatePattern(assetsPattern, '', '', true)

    // image size generation
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

    /**
     * Get asset config
     */
    function getAssetConfig (pattern: string, src: string, dir: string) {
      // image dimensions
      let width: number | undefined = undefined
      let height: number | undefined = undefined
      let ratio: string | undefined = undefined
      let query: string | undefined = undefined
      if (imageFlags.length && isImage(src)) {
        const size = getImageSize(src)
        if (imageFlags.includes('style')) {
          ratio = `${size.width}/${size.height}`
        }
        if (imageFlags.includes('attrs')) {
          width = size.width
          height = size.height
        }
        if (imageFlags.includes('url')) {
          query = `?width=${width}&height=${height}`
        }
      }

      // content id
      const id = Path.join(Path.basename(dir), Path.relative(dir, src)).replaceAll('/', ':')

      // interpolate asset pattern
      const file = interpolatePattern(pattern, src, dir)

      // target file path
      const trg = Path.join(cachePath, assetsDir, file)

      // page src
      const rel = Path.join('/', assetsDir, file)

      // return
      return { id, file, trg, rel, width, height, ratio, query }
    }

    // prepare for building assets
    const publicFolder = Path.join(cachePath, assetsDir)
    const sourceFolders: string[] = Object.values(sources)
    const assets: Record<string, any> = {}

    // set up content ignores
    nuxt.options.content ||= {}
    if (nuxt.options.content) {
      nuxt.options.content.ignores ||= []
    }

    // build assets map
    sourceFolders.forEach(folder => {
      const pattern = `${folder}/**/*.{${extensions.join(',')}}`
      const paths = glob.globSync(pattern)
      paths.forEach((src: string) => {
        // get asset
        const config = getAssetConfig(assetsPattern, src, folder)

        // tell content to ignore file
        nuxt.options.content.ignores.push(config.id)

        // add assets to map
        assets[src] = config
      })
    })

    // copy assets
    nuxt.hook('build:before', function () {
      // make sure temp folder exists
      Fs.mkdirSync(publicFolder, { recursive: true })

      // debug
      if (options.debug) {
        const paths = Object.keys(assets).map(key => '   - ' + assets[key].id.replaceAll(':', '/'))
        log(`Copying ${Object.keys(assets).length} assets:\n\n${paths.join('\n')}\n`)
      }

      // loop over all assets and copy
      Object.keys(assets).forEach(src => {
        const { trg } = assets[src]
        const trgFolder = Path.dirname(trg)
        Fs.mkdirSync(trgFolder, { recursive: true })
        Fs.copyFileSync(src, trg)
      })
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // nitro plugin
    // ---------------------------------------------------------------------------------------------------------------------

    // build config
    const virtualConfig = [
      `export const assets = ${JSON.stringify(assets)}`,
      `export const sources = ${JSON.stringify(sources)}`,
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
        dir: cachePath,
        // maxAge: 60 * 60 * 24 * 365 // 1 year
      })
    })
  },
})
