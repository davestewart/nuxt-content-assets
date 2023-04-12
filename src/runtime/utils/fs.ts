import * as Path from 'path'
import * as Fs from 'fs'

export function readFile (path: string, asJson = false) {
  const text = Fs.readFileSync(path, { encoding: 'utf8' })
  return asJson
    ? JSON.parse(text)
    : text
}

export function writeFile (path: string, data: null | string | number | boolean | object) {
  const text = typeof data === 'object'
    ? JSON.stringify(data, null, '  ')
    : String(data)
  createFolder(Path.dirname(path))
  Fs.writeFileSync(path, text, { encoding: 'utf8' })
}

export async function writeBlob (path: string, data: object) {
  const buffer = Buffer.from(await (data as Blob).arrayBuffer())
  createFolder(Path.dirname(path))
  Fs.writeFileSync(path, buffer)
}

export function copyFile (src: string, trg: string): void {
  createFolder(Path.dirname(trg))
  Fs.copyFileSync(src, trg)
}

export function removeFile (src: string): void {
  Fs.rmSync(src)
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
