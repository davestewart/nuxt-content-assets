import * as Fs from 'fs'
import * as Path from 'path'
import { Blob } from 'buffer'
import glob from 'glob'
import { createStorage } from 'unstorage'
import githubDriver from 'unstorage/drivers/github'
import { MountOptions } from '@nuxt/content'
import { warn, isAsset } from '../utils'

export async function getGithubAssets (key: string, source: MountOptions, tempPath: string): Promise<string[]> {
  // storage
  const storage = createStorage()
  storage.mount(key, githubDriver({
    branch: 'main',
    dir: '/',
    ...source
  } as any))

  // get assets
  const keys = await storage.getKeys()
  const assetKeys = keys.filter(isAsset)
  const assetItems = await Promise.all(assetKeys.map(async id => {
    try {
      const data = await storage.getItem(id)
      return { id, data }
    }
    catch (err: any) {
      warn(err.message)
      return { id }
    }
  }))

  // variables
  const prefix = source.prefix || ''

  // copy assets to temp path
  const paths: string[] = []
  for (const { id, data } of assetItems) {
    if (data) {
      // variables
      const path = id.replaceAll(':', '/')
      const absPath = Path.join(tempPath, path.replace(key, `${key}/${prefix}`))
      const absFolder = Path.dirname(absPath)

      // save file
      const buffer = data.constructor.name === 'Blob'
        ? Buffer.from(await (data as Blob).arrayBuffer())
        : typeof data === 'object'
          ? JSON.stringify(data, null, '  ')
          : String(data)
      Fs.mkdirSync(absFolder, { recursive: true })
      Fs.writeFileSync(absPath, buffer)

      // update paths
      paths.push(absPath)
    }
  }

  // return
  return paths
}

export function getFsAssets (path: string) {
  const pattern = `${path}/**/*.*`
  return glob.globSync(pattern, {
    nodir: true,
    ignore: {
      ignored: p => !isAsset(p.name)
    }
  }) || []
}
