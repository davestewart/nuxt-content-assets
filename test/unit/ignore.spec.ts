import { describe, expect, it } from 'vitest'
import { makeIgnores } from '../../src/runtime/utils'

/**
 * Mirrors the Nuxt Content test
 * @see https://github.com/nuxt/content/blob/main/src/module.ts#L651
 */
function test (file: string) {
  const rx = new RegExp(`^${p}|:${p}`)
  return rx.test(file)
}

const p = makeIgnores('md json yaml csv')

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
    ])
  }

  Object.entries(tests).forEach(([name, { result, data }]) => {
    const state = result ? 'exclude' : 'include'
    describe(name, () => {
      data.forEach(file => {
        it(`should ${state} "${file}"`, () => {
          expect(test(file)).toBe(result)
        })
      })
    })
  })
})
