import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import debounce from 'debounce'

export interface JsonStore<T extends object> {
  /**
   * Live data; the object reference is stable, its contents are replaced on load
   */
  data: T

  /**
   * Load the file from disk, replacing the current data
   */
  load: () => Promise<T>

  /**
   * Save the current data to disk (debounced)
   */
  save: () => void

  /**
   * Stop watching and release the driver
   */
  dispose: () => Promise<void>
}

/**
 * A JSON file shared between the build and server processes
 *
 * Each file should have exactly one writer; readers pass `watch: true` to pick up changes
 *
 * @param dir       The folder containing the file
 * @param file      The file name
 * @param initial   The initial data shape
 * @param watch     Whether to reload when the file changes on disk
 */
export function makeJsonStore<T extends object> (dir: string, file: string, initial: T, watch = false): JsonStore<T> {
  const storage = createStorage({
    driver: fsDriver({
      base: dir,
      // the public folder may contain thousands of files; don't watch or list them
      ignore: ['**/public/**'],
    }),
  })

  const data: T = { ...initial }

  function replace (next: Partial<T> | null | undefined) {
    for (const key of Object.keys(data)) {
      delete (data as any)[key]
    }
    Object.assign(data, initial, next || {})
  }

  async function load () {
    const item = await storage.getItem<T>(file)
    replace(item)
    return data
  }

  const save = debounce(() => {
    void storage.setItem(file, data as any)
  }, 50)

  if (watch) {
    void storage.watch(async (event, key) => {
      if (event === 'update' && key === file) {
        await load()
      }
    })
  }

  return {
    data,
    load,
    save,
    dispose: async () => {
      save.flush()
      await storage.unwatch()
      await storage.dispose()
    },
  }
}
