import * as Fs from 'node:fs'
import Path from 'crosspath'
import { hash } from 'ohash'
import { addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { ModuleMeta, Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { FileAfterParseHook } from '@nuxt/content'
import type {} from '@nuxt/nitro-server'
import type { AssetSource, ImageSize, ModuleOptions } from './types'
import {
  createFolder,
  defaultContentExtensions,
  exists,
  list,
  log,
  matchTokens,
  removeEntry,
  resolveSrcsetOptions,
  setContentExtensions,
  warn,
} from './runtime/utils'
import { getSourceDir, getSourcePrefix, isSourceReady, loadSources, parseSourceBase } from './build/collections'
import { type SourceManager, makeSourceManager } from './build/source'
import { makeAssetIndex } from './build/assets'
import { processContent } from './build/process'
import { setupHmr } from './build/hmr'

// Re-export types for consumers
export type {
  ModuleOptions,
  SrcsetOptions,
  ImageSize,
  AssetConfig,
  AssetMessage,
  AssetSource,
} from './types'

const resolve = createResolver(import.meta.url).resolve

const meta: ModuleMeta = {
  name: 'nuxt-content-assets',
  configKey: 'contentAssets',
  compatibility: {
    nuxt: '>=3.13.0',
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
    const publicPath = Path.join(cachePath, 'public')
    createFolder(publicPath)

    // ---------------------------------------------------------------------------------------------------------------------
    // options
    // ---------------------------------------------------------------------------------------------------------------------

    const isDev = !!nuxt.options.dev
    const isDebug = !!options.debug

    const contentExtensions = matchTokens(options.contentExtensions).join(' ') || defaultContentExtensions
    setContentExtensions(contentExtensions)

    const imageSizes = matchTokens(options.imageSize)
      .map(token => token === 'url' ? 'src' : token) as ImageSize

    const srcset = resolveSrcsetOptions(options.srcset)

    if (isDebug) {
      log(`Cache path: "${Path.relative('.', cachePath)}"`)
    }

    // nuxt content must set up after us, so our cache fingerprint makes it into its parse cache key
    const contentInstalled = (nuxt.options._installedModules || []).some((m: any) => m.meta?.name === '@nuxt/content')
    if (contentInstalled) {
      warn('Add "nuxt-content-assets" before "@nuxt/content" in your modules list, otherwise cached documents may not update when assets change')
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

    // serve public assets
    nuxt.hook('nitro:config', (config) => {
      config.publicAssets ||= []
      config.publicAssets.push({
        dir: publicPath,
        maxAge: (60 * 60 * 24) * 7, // 7 days
      })
    })

    if (nuxt.options._prepare) {
      return
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // assets
    // ---------------------------------------------------------------------------------------------------------------------

    const index = makeAssetIndex(publicPath, srcset)
    const hmr = isDev ? setupHmr(nuxt) : undefined
    const managers: SourceManager[] = []

    /**
     * Copy a source's assets and add them to the index
     */
    function addSource (source: AssetSource) {
      const manager = makeSourceManager(source, publicPath)
      managers.push(manager)
      const pairs = manager.scan()
      for (const [absSrc, absTrg] of pairs) {
        index.set(absSrc, absTrg)
      }
      if (isDebug) {
        list(`Copied assets from "${Path.relative(nuxt.options.rootDir, source.dir) || '.'}"`, pairs.map(([, absTrg]) => Path.relative(publicPath, absTrg)))
      }
      if (isDev) {
        manager.watch((event, absSrc, absTrg) => {
          const asset = event === 'update'
            ? index.set(absSrc, absTrg)
            : index.remove(absSrc)
          if (asset && hmr) {
            hmr.send({ event, src: asset.srcAttr, width: asset.width, height: asset.height })
          }
          if (isDebug) {
            log(`Asset ${event}d: ${asset?.srcAttr || absSrc}`)
          }
        })
      }
      return manager
    }

    // clear files from previous run
    if (exists(publicPath)) {
      for (const name of Fs.readdirSync(publicPath)) {
        if (!/^\.git(?:ignore|keep)$/.test(name)) {
          removeEntry(Path.join(publicPath, name))
        }
      }
    }

    // load sources from content.config.ts and copy assets
    let sources: AssetSource[] = []
    try {
      sources = await loadSources(nuxt)
    }
    catch (err: any) {
      warn(`Unable to load content config: ${err.message}`)
    }
    const pending: AssetSource[] = []
    for (const source of sources) {
      if (isSourceReady(source)) {
        addSource(source)
      }
      else if (source.remote) {
        // cloned by nuxt content during its build; picked up on first parse
        pending.push(source)
      }
    }

    // ---------------------------------------------------------------------------------------------------------------------
    // cache busting
    // ---------------------------------------------------------------------------------------------------------------------

    // nuxt content caches parsed documents by content checksum, which includes its markdown build options; adding our
    // fingerprint there means any change to assets (or our options) re-parses documents so paths and sizes stay correct
    const fingerprint = hash({ v: 3, imageSizes, srcset, assets: index.fingerprint() })
    const nuxtOptions = nuxt.options as Record<string, any>
    nuxtOptions.content ||= {}
    const content = nuxtOptions.content
    content.build ||= {}
    content.build.markdown ||= {}
    content.build.markdown.contentAssets = fingerprint

    // ---------------------------------------------------------------------------------------------------------------------
    // hooks
    // ---------------------------------------------------------------------------------------------------------------------

    /**
     * Rewrite asset paths as nuxt content parses each document
     */
    nuxt.hook('content:file:afterParse', (ctx: FileAfterParseHook) => {
      const { file, content, collection } = ctx
      if (!file.path) {
        return
      }

      // remote sources are cloned by nuxt content just before parsing, so pick them up now
      if (pending.length) {
        for (const source of pending.slice()) {
          if (isSourceReady(source) && file.path.startsWith(source.dir)) {
            pending.splice(pending.indexOf(source), 1)
            addSource(source)
          }
        }
      }

      // custom or unexpected sources: derive from the collection's resolved sources
      const docDir = Path.dirname(file.path)
      if (!managers.some(manager => docDir.startsWith(manager.source.dir))) {
        for (const source of (collection.source || []) as any[]) {
          if (source?.cwd && typeof source.include === 'string') {
            const { fixed } = parseSourceBase(source.include)
            const dir = getSourceDir(source.cwd, fixed)
            if (file.path.startsWith(dir) && !managers.some(manager => manager.source.dir === dir)) {
              addSource({
                dir,
                prefix: getSourcePrefix(fixed, source.prefix),
                exclude: source.exclude || [],
                remote: !!source.repository,
              })
            }
          }
        }
      }

      const updated = processContent(file.path, content as Record<string, any>, index, imageSizes)
      if (isDebug && updated.length) {
        list(`Processed "${Path.relative(nuxt.options.rootDir, file.path)}"`, updated)
      }
    })

    // live reload
    if (isDev) {
      addPlugin({ src: resolve('./runtime/plugin.client'), mode: 'client' })
    }

    // cleanup
    nuxt.hook('close', async () => {
      for (const manager of managers) {
        await manager.dispose()
      }
    })
  },
})
