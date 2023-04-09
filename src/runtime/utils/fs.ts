import * as Path from 'path'
import * as Fs from 'fs'

export function writeFile (path: string, data: null | string | number | boolean | object) {
  const text = typeof data === 'object'
    ? JSON.stringify(data, null, '  ')
    : String(data)
  createFolder(Path.dirname(path))
  Fs.writeFileSync(path, text, { encoding: 'utf8' })
}

export function copyFile (src: string, trg: string) {
  createFolder(Path.dirname(trg))
  Fs.copyFileSync(src, trg)
}

export function createFolder (path: string) {
  Fs.mkdirSync(path, { recursive: true })
}

export function removeFolder (path: string) {
  const isDownstream = path.startsWith(Path.resolve())
  if (isDownstream) {
    Fs.rmSync(path, { recursive: true, force: true })
  }
}
