import * as Fs from 'node:fs'
import Path from 'crosspath'
import chokidar, { type FSWatcher } from 'chokidar'
import micromatch from 'micromatch'
import type { AssetSource } from '../types'
import { copyFile, exists, isAsset, isExcluded, removeFile, removeOrdering } from '../runtime/utils'

export type SourceEvent = 'update' | 'remove'

export type SourceCallback = (event: SourceEvent, absSrc: string, absTrg: string) => void

/**
 * Mirrors assets from a source folder to the public folder
 *
 * @param source      The source folder
 * @param publicPath  The absolute path to the public folder
 */
export function makeSourceManager (source: AssetSource, publicPath: string) {
  let watcher: FSWatcher | undefined

  /**
   * Public path for a source file
   */
  function getTarget (absSrc: string): string {
    const rel = removeOrdering(Path.relative(source.dir, absSrc))
    return Path.join(publicPath, source.prefix, rel)
  }

  /**
   * Whether a source file should be treated as an asset
   */
  function isAssetFile (absSrc: string): boolean {
    const rel = Path.relative(source.dir, absSrc)
    if (!rel || rel.startsWith('..')) {
      return false
    }
    if (isExcluded(rel) || !isAsset(rel)) {
      return false
    }
    return source.exclude.length === 0 || !micromatch.isMatch(rel, source.exclude, { dot: true })
  }

  /**
   * Copy a source file to the public folder
   */
  function copy (absSrc: string): string {
    const absTrg = getTarget(absSrc)
    copyFile(absSrc, absTrg)
    return absTrg
  }

  /**
   * Remove a source file's copy from the public folder
   */
  function remove (absSrc: string): string {
    const absTrg = getTarget(absSrc)
    removeFile(absTrg)
    return absTrg
  }

  /**
   * Copy all assets to the public folder
   *
   * @returns Pairs of [source, target] absolute paths
   */
  function scan (): Array<[string, string]> {
    if (!exists(source.dir)) {
      return []
    }
    const entries = Fs.readdirSync(source.dir, { recursive: true, withFileTypes: true })
    const pairs: Array<[string, string]> = []
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue
      }
      const absSrc = Path.join(entry.parentPath ?? (entry as any).path, entry.name)
      if (isAssetFile(absSrc)) {
        pairs.push([absSrc, copy(absSrc)])
      }
    }
    return pairs.sort((a, b) => a[0].localeCompare(b[0]))
  }

  /**
   * Watch the source folder for asset changes
   */
  function watch (callback: SourceCallback) {
    if (watcher || !exists(source.dir)) {
      return
    }
    watcher = chokidar.watch(source.dir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
    })
    const onUpdate = (path: string) => {
      const absSrc = Path.normalize(path)
      if (isAssetFile(absSrc)) {
        callback('update', absSrc, copy(absSrc))
      }
    }
    const onRemove = (path: string) => {
      const absSrc = Path.normalize(path)
      if (isAssetFile(absSrc)) {
        callback('remove', absSrc, remove(absSrc))
      }
    }
    watcher.on('add', onUpdate)
    watcher.on('change', onUpdate)
    watcher.on('unlink', onRemove)
  }

  async function dispose () {
    await watcher?.close()
    watcher = undefined
  }

  return {
    source,
    getTarget,
    isAssetFile,
    scan,
    watch,
    dispose,
  }
}

export type SourceManager = ReturnType<typeof makeSourceManager>
