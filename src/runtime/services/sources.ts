import * as Path from 'path'
import { createStorage, WatchEvent, Storage } from 'unstorage'
import githubDriver, { GithubOptions } from 'unstorage/drivers/github'
import fsDriver, { FSStorageOptions } from 'unstorage/drivers/fs'
import { MountOptions } from '@nuxt/content'
import { warn, isAsset, toPath, removeFile, copyFile, writeBlob, writeFile, toKey, log, deKey } from '../utils'

/**
 * Make a Storage instance
 */
export function makeStorage (source: MountOptions | string, key = ''): Storage {
  const storage = createStorage()
  const options = typeof source === 'string'
    ? { driver: 'fs', base: source }
    : source
  switch (options.driver) {
    case 'fs':
      storage.mount(key, fsDriver({
        ...options,
        ignore: ['[^:]+?\\.md'],
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
}

/**
 * Make a SourceManager instance
 *
 * Each Source Manager is responsible for mirroring source files to the public folder
 *
 * @param key
 * @param source
 * @param publicPath
 * @param callback
 */
export function makeSourceManager (key: string, source: MountOptions, publicPath: string, callback?: (event: WatchEvent, path: string) => void): SourceManager {
  // only fs will trigger watch events
  async function onWatch (event: WatchEvent, key: string) {
    if (isAsset(key)) {
      const path = event === 'update'
        ? await copyItem(key)
        : removeItem(key)
      if (callback) {
        callback(event, path)
      }
    }
  }

  // relative source file path from key
  function getRelSrc(key: string) {
    return toPath(key)
      .replace(/\w+/, '')
      .replace(source.prefix || '', '')
  }

  // absolute source file path from key
  function getAbsSrc(key: string) {
    return Path.join(source.base, getRelSrc(key))
  }

  // relative target file path from key
  function getRelTrg(key: string) {
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
    return keys.filter(isAsset)
  }

  /**
   * Copy all files from source to public folder
   */
  async function init () {
    // variables
    const keys = await getKeys()
    const paths: string[] = []

    // copy assets to temp path
    for (const key of keys) {
      const path = await copyItem(key)
      paths.push(path)
    }

    // return
    return paths
  }

  // storage
  const storage = makeStorage(source, key)
  storage.watch(onWatch)

  // return
  return {
    storage,
    init,
    keys: getKeys,
  }
}
