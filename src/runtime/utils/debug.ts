import Path from 'path'
import Fs from 'fs'
import { moduleKey } from '../config'

export function log (...data: any[]): void {
  console.info(`[${moduleKey}]`, ...data)
}

export function warn (...data: any[]): void {
  console.warn(`[${moduleKey}]`, ...data)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function dump (name: string, data: any): void {
  const path = `debug/${name}.json`
  const folder = Path.dirname(path)
  log(`Dumping "${path}"`)
  Fs.mkdirSync(folder, { recursive: true })
  Fs.writeFileSync(path, JSON.stringify(data, null, '  '), { encoding: 'utf8' })
}
