import Path from 'path'
import Fs from 'fs'
import { moduleKey } from '../../config'

export function log (...data: any[]) {
  console.info(`[${moduleKey}]`, ...data)
}

export function warn (...data: any[]) {
  console.warn(`[${moduleKey}]`, ...data)
}

export function dump (name: string, data: any) {
  const path = `debug/${name}.json`
  const folder = Path.dirname(path)
  log(`Dumping "${path}"`)
  Fs.mkdirSync(folder, { recursive: true })
  Fs.writeFileSync(path, JSON.stringify(data, null, '  '), { encoding: 'utf8' })
}
