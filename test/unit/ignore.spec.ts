import { describe, expect, it } from 'vitest'

describe('ignore', () => {
  it('regexp should ignore non docs', () => {
    // @see https://stackoverflow.com/a/15508679
    const p = '^((?!(md|json|yaml|csv)).)*$'

    const rx = new RegExp(`^${p}|:${p}`)

    const files = [
      ':article.md',
      ':article.json',
      ':image.jpg',
      ':image.png',
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
      ':image.png': true
    })
  })
})
