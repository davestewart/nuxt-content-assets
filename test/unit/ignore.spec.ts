import { describe, expect, it } from 'vitest'
import { makeIgnores } from '../../src/runtime/utils'

/**
 * Copy of Nuxt makeIgnored() function
 *
 * @see https://github.com/nuxt/content/blob/v2/src/runtime/utils/config.ts
 */
function makeIgnored (ignores: string[]): (key: string) => boolean {
  const rxAll = ['/\\.', '/-', ...ignores.filter(p => p)].map(p => new RegExp(p))
  return function isIgnored (key: string): boolean {
    const path = '/' + key.replace(/:/g, '/')
    return rxAll.some(rx => rx.test(path))
  }
}

/**
 * Mirrors the Nuxt Content test
 *
 * @see https://github.com/nuxt/content/blob/v2/src/module.ts#L633C5-L633C58
 */
const isIgnored = makeIgnored([
  makeIgnores('md json yaml csv')
])

/**
 * Tests for the ignore function
 */
describe('ignore', () => {
  function makeTest (result: boolean, data: string[]) {
    return { result, data }
  }

  const tests = {
    content: makeTest(false, [
      ':article.md',
      ':1.article.md',
      ':12.some-article.md',
    ]),
    data: makeTest(false, [
     ':article.json',
    ]),
    assets: makeTest(true, [
      ':image.jpg',
      'content:paths:some-image.jpg',
      'content:json-tutorial:some-image.png',
    ])
  }

  Object.entries(tests).forEach(([name, { result, data }]) => {
    const state = result ? 'exclude' : 'include'
    describe(name, () => {
      data.forEach(file => {
        it(`should ${state} "${file}"`, () => {
          expect(isIgnored(file)).toBe(result)
        })
      })
    })
  })
})
