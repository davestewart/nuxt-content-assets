import * as Fs from 'node:fs'
import Path from 'crosspath'

export function readFile (path: string): string
export function readFile<T = any> (path: string, asJson: true): T
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

export async function writeBlob (path: string, data: Blob) {
  const buffer = Buffer.from(await data.arrayBuffer())
  createFolder(Path.dirname(path))
  Fs.writeFileSync(path, buffer)
}

export function copyFile (src: string, trg: string): void {
  createFolder(Path.dirname(trg))
  Fs.copyFileSync(src, trg)
}

export function removeFile (src: string): void {
  Fs.rmSync(src, { force: true })
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

export function removeEntry (path: string) {
  if (Fs.existsSync(path)) {
    if (isFile(path)) {
      removeFile(path)
    }
    else {
      removeFolder(path)
    }
  }
}

export function isFile (path: string) {
  return Fs.lstatSync(path).isFile()
}

export function exists (path: string) {
  return Fs.existsSync(path)
}
