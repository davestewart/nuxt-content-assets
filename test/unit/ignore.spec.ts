import { describe, expect, it } from 'vitest'

import { makeIgnores } from '../../src/runtime/utils'

describe('ignore', () => {
  it('regexp should ignore non docs', () => {
    const p = makeIgnores('md json yaml csv')

    // @see https://github.com/nuxt/content/blob/main/src/module.ts#L651
    const rx = new RegExp(`^${p}|:${p}`)

    const files = [
      ':article.md',
      ':article.json',
      ':image.jpg',
      'content:paths:some-image.jpg',
    ]

    const results = files
      .reduce((output, file) => {
        output[file] = rx.test(file)
        return output
      }, {} as Record<string, boolean>)

    expect(results).toMatchObject({
      ':article.md': false,
      ':article.json': false,
      ':image.jpg': true,
      'content:paths:some-image.jpg': true,
    })
  })
})
