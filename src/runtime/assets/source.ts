import Path from 'crosspath'
import { type MountOptions } from '@nuxt/content'
import githubDriver, { type GithubOptions } from 'unstorage/drivers/github'
import fsDriver, { type FSStorageOptions } from 'unstorage/drivers/fs'
import { createStorage, type WatchEvent, type Storage } from 'unstorage'
import { warn, isAsset, toPath, removeFile, copyFile, writeBlob, writeFile, deKey, isExcluded } from '../utils'

/**
 * Helper function to determine valid ids
 */
function isAssetId (id: string) {
  const path = toPath(id)
  return !isExcluded(path) && isAsset(path)
}

/**
 * Make a Storage instance that monitors assets from a single source
 */
export function makeSourceStorage (source: MountOptions | string, key = ''): Storage {
  const storage = createStorage()
  const options = typeof source === 'string'
    ? { driver: 'fs', base: source }
    : source
  switch (options.driver) {
    case 'fs':
      storage.mount(key, fsDriver({
        ...options,
        ignore: [
          '[^:]+?\\.md',
          '_dir\\.yml',
        ],
      } as FSStorageOptions))
      break

    case 'github':
      storage.mount(key, githubDriver({
        branch: 'main',
        dir: '/',
        ...options,
      } as unknown as GithubOptions))
      break
  }
  return storage
}

export interface SourceManager {
  storage: Storage,
  init: () => Promise<string[]>
  keys: () => Promise<string[]>
  dispose: () => Promise<void>
}

/**
 * Make a SourceManager instance
 *
 * Each Source Manager is responsible for watching and mirroring source assets to the public assets folder
 *
 * @param key
 * @param source
 * @param publicPath
 * @param callback
 */
export function makeSourceManager (key: string, source: MountOptions, publicPath: string, callback?: (event: WatchEvent, path: string) => void): SourceManager {
  // only fs will trigger watch events
  async function onWatch (event: WatchEvent, key: string) {
    if (isAssetId(key)) {
      const path = event === 'update'
        ? await copyItem(key)
        : removeItem(key)
      if (callback) {
        callback(event, path)
      }
    }
  }

  // relative source file path from key
  function getRelSrc (key: string) {
    return toPath(key)
      .replace(/\w+/, '')
      .replace(source.prefix || '', '')
  }

  // absolute source file path from key
  function getAbsSrc (key: string) {
    return Path.join(source.base, getRelSrc(key))
  }

  // relative target file path from key
  function getRelTrg (key: string) {
    return Path.join(source.prefix || '', toPath(deKey(key)))
  }

  // absolute target file path from key
  function getAbsTrg (key: string) {
    return Path.join(publicPath, getRelTrg(key))
  }

  /**
   * Remove storage item from public folder
   * @param key
   */
  function removeItem (key: string): string {
    const absTrg = getAbsTrg(key)
    removeFile(absTrg)
    return absTrg
  }

  /**
   * Copy storage item to public folder
   */
  async function copyItem (key: string): Promise<string> {
    // variables
    const absTrg = getAbsTrg(key)
    const driver = source.driver

    // fs
    if (driver === 'fs') {
      const absSrc = getAbsSrc(key)
      copyFile(absSrc, absTrg)
    }

    // github
    else if (driver === 'github') {
      try {
        const data = await storage.getItem(key)
        if (data) {
          data?.constructor.name === 'Blob'
            ? await writeBlob(absTrg, data as object)
            : writeFile(absTrg, data)
        }
        else {
          warn(`No data for key "${key}"`)
        }
      }
      catch (err: any) {
        warn(err.message)
      }
    }

    // return paths
    return absTrg
  }

  /**
   * Get only asset keys
   */
  async function getKeys () {
    const keys = await storage.getKeys()
    return keys.filter(isAssetId)
  }

  /**
   * Copy all files from source to public folder
   */
  async function init () {
    // variables
    const keys = await getKeys()
    const paths: string[] = []

    // copy assets to public path
    for (const key of keys) {
      const path = await copyItem(key)
      paths.push(path)
    }

    // return
    return paths
  }

  // storage
  const storage = makeSourceStorage(source, key)
  void storage.watch(onWatch)

  // cleanup
  async function dispose () {
    await storage.unwatch()
    await storage.dispose()
  }

  // return
  return {
    storage,
    init,
    keys: getKeys,
    dispose,
  }
}
