import Path from 'crosspath'
import { hash } from 'ohash'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import {
  createFolder,
  defaultContentExtensions,
  exists,
  isImage,
  list,
  log,
  makeIgnores,
  matchTokens,
  resolveSrcsetOptions,
  setContentExtensions,
  warn,
} from './runtime/utils'
import { setupSocketServer } from './build/sockets/setup'
import { makeSourceManager } from './runtime/assets/source'
import { getAssetPaths, makeAssetsManager } from './runtime/assets/public'
import { getStaleContentIds, makeContentCache } from './runtime/content/cache'
import { rewriteContent } from './runtime/content/parsed'
import type { ModuleMeta, Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { MountOptions } from '@nuxt/content'
import type { ImageSize, ModuleOptions } from './types'

// Re-export types for consumers
export type {
  ModuleOptions,
  SrcsetOptions,
  ImageSize,
  AssetConfig,
  AssetMessage,
  SocketInstance,
} from './types'

const resolve = createResolver(import.meta.url).resolve

const meta: ModuleMeta = {
  name: 'nuxt-content-assets',
  configKey: 'contentAssets',
  compatibility: {
    nuxt: '>=3.0.0',
  },
}

export default defineNuxtModule<ModuleOptions>({
  meta,

  defaults: {
    imageSize: '',
    contentExtensions: defaultContentExtensions,
    srcset: true,
    debug: false,
  },

  async setup (options: ModuleOptions, nuxt: Nuxt) {
    // ---------------------------------------------------------------------------------------------------------------------
    // paths
    // ---------------------------------------------------------------------------------------------------------------------

    // assets cache; ships with the package as `cache/` (a Nuxt layer, so Nuxt Image can serve from it)
    const cachePath = resolve('../cache')

    // public folder (cache/public)
    const publicPath = Path.join(cachePath, 'public')
    createFolder(publicPath)

    // nuxt content's parsed cache (.nuxt/content-cache)
    const contentPath = Path.join(nuxt.options.buildDir, 'content-cache')

    // where we remember what we did last run (.nuxt/content-assets.json)
    const metaPath = Path.join(nuxt.options.buildDir, 'content-assets.json')

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    const isDev = !!nuxt.options.dev
    const isDebug = !!options.debug

    // content extensions; used to tell nuxt content to ignore assets, and us to ignore content
    const contentExtensions = matchTokens(options.contentExtensions).join(' ') || defaultContentExtensions
    setContentExtensions(contentExtensions)
    // @ts-expect-error content options may not be typed if @nuxt/content isn't installed
    nuxt.options.content ||= {}
    nuxt.options.content!.ignores ||= []
    nuxt.options.content!.ignores.push(makeIgnores(contentExtensions))

    // image size hints
    const imageSizes = matchTokens(options.imageSize)
      .map(token => token === 'url' ? 'src' : token) as ImageSize

    // srcset
    const srcset = resolveSrcsetOptions(options.srcset)

    // fingerprint of everything that affects how content is rewritten
    const fingerprint = hash({ v: 1, imageSizes, srcset, contentExtensions })

    if (isDebug) {
      log(`Cache path: "${Path.relative('.', cachePath)}"`)
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // layer (so Nuxt Image's IPX can find the public folder in development)
    // ---------------------------------------------------------------------------------------------------------------------

    const hasLayer = nuxt.options._layers.some(layer => Path.normalize(layer.config.rootDir || layer.cwd) === cachePath)
    if (!hasLayer) {
      (nuxt.options._layers as NuxtConfigLayer[]).push({
        cwd: cachePath,
        configFile: Path.join(cachePath, 'nuxt.config.ts'),
        config: {
          rootDir: cachePath,
          srcDir: cachePath,
          dir: { public: 'public' },
        },
      } as NuxtConfigLayer)
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // sources
    // ---------------------------------------------------------------------------------------------------------------------

    type Sources = Record<string, MountOptions>
    const sources: Sources = Array
      .from(nuxt.options._layers)
      .map((layer: NuxtConfigLayer) => layer.config?.content?.sources)
      .reduce((output: Sources, sources) => {
        if (sources && !Array.isArray(sources)) {
          Object.assign(output, sources as Sources)
        }
        return output
      }, {})

    // add default content folder
    if (!sources.content) {
      const content = Path.join(nuxt.options.rootDir, 'content')
      if (exists(content)) {
        sources.content = {
          driver: 'fs',
          base: content,
        }
      }
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // assets
    // ---------------------------------------------------------------------------------------------------------------------

    const assets = makeAssetsManager(publicPath, isDev)
    const cache = makeContentCache(contentPath, metaPath)

    /**
     * Callback for when assets change (dev only)
     *
     * - if the asset is updated or deleted, we tell the browser to update the asset's properties
     * - if the asset is an image and changes size, we also rewrite the cached content
     *
     * @param event   The type of update
     * @param absTrg  The absolute path to the copied asset
     */
    function onAssetChange (event: 'update' | 'remove', absTrg: string) {
      const { srcAttr } = getAssetPaths(publicPath, absTrg)
      let width: number | undefined
      let height: number | undefined

      if (event === 'update') {
        const oldAsset = isImage(absTrg) && imageSizes.length
          ? assets.getAsset(absTrg)
          : undefined
        const newAsset = assets.setAsset(absTrg)
        width = newAsset.width
        height = newAsset.height

        // image size changed: rewrite cached documents so the change is permanent
        if (oldAsset && (oldAsset.width !== newAsset.width || oldAsset.height !== newAsset.height)) {
          for (const id of assets.getContentIds(absTrg)) {
            rewriteContent(cache.getPath(id), newAsset)
          }
        }
      }
      else {
        assets.removeAsset(absTrg)
      }

      if (socket) {
        socket.send({ event, src: srcAttr, width, height })
      }
    }

    // socket to communicate changes to client
    addPlugin(resolve('./runtime/sockets/plugin'))
    const socket = isDev && nuxt.options.content?.watch !== false
      ? await setupSocketServer('content-assets')
      : null

    // source managers
    const managers = Object.entries(sources).map(([key, source]) => {
      if (isDebug) {
        log(`Creating source "${key}"`)
      }
      return { key, manager: makeSourceManager(key, source, publicPath, onAssetChange, isDev) }
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // hooks
    // ---------------------------------------------------------------------------------------------------------------------

    // copy assets and invalidate stale content
    // note: `modules:done` (rather than `build:before`) as Nuxt skips the build when `experimental.buildCache` restores
    nuxt.hook('modules:done', async () => {
      if (nuxt.options._prepare) {
        return
      }

      // what we knew last run
      const previous = await assets.load()
      const previousFingerprint = cache.getFingerprint()

      // copy assets
      assets.clear()
      for (const { key, manager } of managers) {
        const paths = await manager.init()
        paths.forEach(path => assets.setAsset(path))
        if (isDebug) {
          list(`Copied "${key}" assets`, paths.map(path => Path.relative(publicPath, path)))
        }
      }

      // invalidate nuxt content's cache so relative paths get rewritten
      const isFirstRun = Object.keys(previous).length === 0
      if (isFirstRun || previousFingerprint !== fingerprint) {
        if (isDebug) {
          log('Clearing content cache')
        }
        cache.clear()
      }
      else {
        const ids = getStaleContentIds(previous, assets.assets, assets.content)
        if (ids.length) {
          if (isDebug) {
            list('Invalidating cached content', ids)
          }
          cache.invalidate(ids)
        }
      }
      cache.setFingerprint(fingerprint)
    })

    // cleanup when nuxt closes
    nuxt.hook('close', async () => {
      await assets.dispose()
      for (const { manager } of managers) {
        await manager.dispose()
      }
    })

    // ---------------------------------------------------------------------------------------------------------------------
    // nitro
    // ---------------------------------------------------------------------------------------------------------------------

    const makeVar = (name: string, value: any) => `export const ${name} = ${JSON.stringify(value)};`
    const virtualConfig = [
      makeVar('publicPath', publicPath),
      makeVar('imageSizes', imageSizes),
      makeVar('srcset', srcset),
      makeVar('contentExtensions', contentExtensions),
      makeVar('debug', isDebug),
    ].join('\n')

    nuxt.hook('nitro:config', (config) => {
      // server plugin
      config.plugins ||= []
      config.plugins.push(resolve('./runtime/content/plugin'))

      // make config available to nitro
      config.virtual ||= {}
      config.virtual[`#${meta.name}`] = virtualConfig

      // serve public assets
      config.publicAssets ||= []
      config.publicAssets.push({
        dir: publicPath,
        maxAge: (60 * 60 * 24) * 7, // 7 days
      })
    })

    if (!exists(Path.join(cachePath, 'nuxt.config.ts'))) {
      warn('Cache layer is missing its nuxt.config.ts; Nuxt Image may not be able to serve assets in development')
    }
  },
})
