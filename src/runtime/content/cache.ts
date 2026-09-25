import Path from 'crosspath'
import { exists, readFile, removeEntry, toPath, writeFile } from '../utils'
import type { AssetIndex, ContentIndex } from '../../types'

/**
 * Compare two asset indexes
 */
export function diffAssets (prev: AssetIndex, next: AssetIndex) {
  const added: string[] = []
  const removed: string[] = []
  const changed: string[] = []
  for (const key of Object.keys(prev)) {
    const a = prev[key]
    const b = next[key]
    if (!b) {
      removed.push(key)
    }
    else if (a.width !== b.width || a.height !== b.height) {
      changed.push(key)
    }
  }
  for (const key of Object.keys(next)) {
    if (!prev[key]) {
      added.push(key)
    }
  }
  return { added, removed, changed }
}

/**
 * Work out which documents are stale given a change in assets
 *
 * - documents which referenced removed or resized assets
 * - documents which referenced paths that now resolve to added assets
 */
export function getStaleContentIds (prev: AssetIndex, next: AssetIndex, content: ContentIndex): string[] {
  const { added, removed, changed } = diffAssets(prev, next)
  const ids = new Set<string>()
  for (const key of [...removed, ...changed]) {
    for (const id of content.hits[key] || []) {
      ids.add(id)
    }
  }
  for (const key of added) {
    for (const id of [...(content.misses[key] || []), ...(content.hits[key] || [])]) {
      ids.add(id)
    }
  }
  return Array.from(ids)
}

/**
 * Manages Nuxt Content's parsed cache (`.nuxt/content-cache`)
 *
 * @param contentPath   The absolute path to the content cache folder
 * @param metaPath      The absolute path to the file storing this module's cache fingerprint
 */
export function makeContentCache (contentPath: string, metaPath: string) {
  /**
   * Get the path to a cached document
   */
  function getPath (id: string) {
    return Path.join(contentPath, 'parsed', toPath(id))
  }

  /**
   * Remove all cached documents
   */
  function clear () {
    removeEntry(contentPath)
  }

  /**
   * Remove specific cached documents
   */
  function invalidate (ids: string[]) {
    for (const id of ids) {
      removeEntry(getPath(id))
    }
  }

  /**
   * Read the fingerprint from the previous run
   */
  function getFingerprint (): string | undefined {
    if (exists(metaPath)) {
      try {
        return readFile<{ fingerprint?: string }>(metaPath, true).fingerprint
      }
      catch {
        // corrupt; treat as missing
      }
    }
  }

  /**
   * Store the fingerprint for the next run
   */
  function setFingerprint (fingerprint: string) {
    writeFile(metaPath, { fingerprint })
  }

  return {
    getPath,
    clear,
    invalidate,
    getFingerprint,
    setFingerprint,
  }
}
