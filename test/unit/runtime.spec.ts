import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const runtime = resolve(__dirname, '../../src/runtime')

function files (dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? files(join(dir, entry.name))
    : entry.name.endsWith('.ts') ? [join(dir, entry.name)] : [])
}

describe('runtime', () => {
  // runtime files ship one by one, but anything outside runtime/ is bundled into the module,
  // so a value imported from there has no file to load in the app
  it('should only import types from outside the runtime folder', () => {
    const imports = files(runtime).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return [...text.matchAll(/^import (?!type )[^'\n]* from '(\.[^']+)'/gm)]
        .filter(([, path]) => relative(runtime, resolve(dirname(file), path!)).startsWith('..'))
        .map(([line]) => `${relative(runtime, file)}: ${line}`)
    })
    expect(imports).toEqual([])
  })
})
