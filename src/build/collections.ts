import Path from 'crosspath'
import { loadConfig } from 'c12'
import { hash } from 'ohash'
import type { Nuxt } from '@nuxt/schema'
import type { AssetSource } from '../types'
import { exists, writeFile } from '../runtime/utils'

/**
 * A collection source as written in content.config.ts (before Nuxt Content resolves it)
 */
interface RawSource {
  include: string
  exclude?: string[]
  prefix?: string
  cwd?: string
  repository?: string | { url: string, branch?: string, tag?: string }
  _resolved?: boolean
}

interface RawCollection {
  source?: string | RawSource | Array<string | RawSource>
  __rootDir?: string
}

/**
 * Split a glob into its fixed (static) folder part and its dynamic part
 *
 * Mirrors Nuxt Content's `parseSourceBase()`
 */
export function parseSourceBase (include: string) {
  const [fixed] = include.includes('*') ? include.split('*') : ['']
  return { fixed: fixed || '' }
}

/**
 * The folder assets are scanned from (no trailing slash)
 */
export function getSourceDir (cwd: string, fixed: string): string {
  return Path.join(cwd, fixed).replace(/(?<=.)\/+$/, '')
}

/**
 * The web path prefix for a source (mirrors Nuxt Content's default unless overridden)
 */
export function getSourcePrefix (fixed: string, prefix?: string): string {
  return prefix ?? ('/' + fixed).replace(/\/+$/, '')
}

/**
 * Work out where Nuxt Content clones a git source
 *
 * Mirrors Nuxt Content's `defineGitSource()`; returns undefined if the url can't be parsed
 */
export function getGitSourceDir (repository: RawSource['repository'], rootDir: string): string | undefined {
  if (!repository) {
    return
  }
  const config = typeof repository === 'string'
    ? { url: repository }
    : repository
  const match = config.url.match(/^(?:https?:\/\/|git@)([^/:]+)[/:]([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+))?\/?$/)
  if (!match) {
    return
  }
  const [, host, owner, name, urlRef] = match
  const resolvedRef = config.branch || config.tag || urlRef || 'main'
  const refKey = /^[\w.-]+$/.test(resolvedRef)
    ? resolvedRef
    : `${resolvedRef.replace(/[^\w.-]+/g, '-')}-${hash(resolvedRef).slice(0, 8)}`
  const refPrefix = config.tag ? 'tag-' : ''
  return Path.join(rootDir, '.data', 'content', `${host}-${owner}-${name}-${refPrefix}${refKey}`)
}

/**
 * Resolve a raw source to an asset source
 */
export function resolveSource (source: string | RawSource, rootDir: string): AssetSource | undefined {
  const raw: RawSource = typeof source === 'string'
    ? { include: source }
    : { ...source }
  if (!raw.include) {
    return
  }
  raw.include = raw.include.replace(/^(\.\/|\.\.\/|\/)*/, '')
  const { fixed } = parseSourceBase(raw.include)
  const remote = !!raw.repository
  const cwd = remote
    ? getGitSourceDir(raw.repository, rootDir)
    : raw.cwd
      ? Path.normalize(raw.cwd).replace(/^~~\//, rootDir + '/')
      : Path.join(rootDir, 'content')
  if (!cwd) {
    return
  }
  return {
    dir: getSourceDir(cwd, fixed),
    prefix: getSourcePrefix(fixed, raw.prefix),
    exclude: raw.exclude || [],
    remote,
  }
}

/**
 * A stand-in for `@nuxt/content` whilst loading content.config.ts
 *
 * We only need each collection's `source`; schema helpers (`z`, `property`, etc.) are replaced with a chainable no-op
 * so configs load without Nuxt Content's validators (which it only sets up during its own module setup)
 */
const shim = `
// anything chainable, but never thenable (or awaiting it would hang)
const noop = new Proxy(function () {}, {
  get: (target, key) => {
    if (key === 'then') return undefined
    if (key === Symbol.toPrimitive) return () => ''
    if (typeof key === 'symbol') return undefined
    return noop
  },
  apply: () => noop,
  construct: () => noop,
})
const passthrough = value => value
export const defineContentConfig = passthrough
export const defineCollection = passthrough
export const defineCollectionSource = passthrough
export const defineTransformer = passthrough
export const z = noop
export const property = noop
export const metaStandardSchema = noop
export const pageStandardSchema = noop
export default {}
`.trim()

/**
 * Load content.config.ts from all layers (the same way Nuxt Content does) and resolve asset sources
 */
export async function loadSources (nuxt: Nuxt): Promise<AssetSource[]> {
  const layers = [...nuxt.options._layers].reverse()
  const collections: Record<string, RawCollection> = {}

  // shim @nuxt/content so schemas don't need validators
  const shimPath = Path.join(nuxt.options.buildDir, 'content-assets', 'nuxt-content-shim.mjs')
  writeFile(shimPath, shim)

  // provide the same global Nuxt Content does whilst loading
  const g = globalThis as any
  const previous = g.defineContentConfig
  g.defineContentConfig = (c: any) => c
  try {
    for (const layer of layers) {
      const rootDir = layer.config.rootDir || layer.cwd
      if (!rootDir) {
        continue
      }
      const { config } = await loadConfig<{ collections?: Record<string, RawCollection> }>({
        name: 'content',
        cwd: rootDir,
        defaultConfig: { collections: {} },
        jitiOptions: {
          alias: { '@nuxt/content': shimPath },
          // don't share the module cache with nuxt content's own load
          moduleCache: false,
          fsCache: false,
        },
      })
      for (const [name, collection] of Object.entries(config?.collections || {})) {
        collections[name] = { ...collection, __rootDir: rootDir }
      }
    }
  }
  finally {
    if (previous === undefined) {
      delete g.defineContentConfig
    }
    else {
      g.defineContentConfig = previous
    }
  }

  // nuxt content's default collection
  if (Object.keys(collections).length === 0) {
    collections.content = { source: '**', __rootDir: nuxt.options.rootDir }
  }

  // resolve
  const sources: AssetSource[] = []
  for (const collection of Object.values(collections)) {
    const rootDir = collection.__rootDir || nuxt.options.rootDir
    const raw = collection.source
    const list = Array.isArray(raw) ? raw : raw ? [raw] : []
    for (const item of list) {
      const source = resolveSource(item, rootDir)
      if (source && !sources.some(s => s.dir === source.dir && s.prefix === source.prefix)) {
        sources.push(source)
      }
    }
  }
  return sources
}

/**
 * Whether a source folder exists yet (remote sources are cloned by Nuxt Content on first build)
 */
export function isSourceReady (source: AssetSource) {
  return exists(source.dir)
}
