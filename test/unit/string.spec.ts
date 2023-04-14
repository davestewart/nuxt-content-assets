import { describe, it, expect } from 'vitest'
import { matchTokens } from '../../src/runtime/utils'

describe('string', () => {
  it('should correctly match tokens', () => {
    // basic
    expect(matchTokens('foo bar baz'))
      .toEqual(['foo', 'bar', 'baz'])

    // additional characters
    expect(matchTokens('ya?ml path/to/file storage:path:file.md'))
      .toEqual(['ya?ml', 'path/to/file', 'storage:path:file.md'])

    // dedupe
    expect(matchTokens('one one one two two three'))
      .toEqual(['one', 'two', 'three'])

    // deep
    expect(matchTokens({ a: 'one', b: 'two', c: { d: 'three', e: ['four', 'five'] } }))
      .toEqual(['one', 'two', 'three', 'four', 'five'])

    // split on space, comma or pipe
    expect(matchTokens('one two|three,four'))
      .toEqual(['one', 'two', 'three', 'four'])
  })

  it('should handle erroneous situations', function () {
    // filter empty tokens
    expect(matchTokens('one     two,,,,,three|||||four'))
      .toEqual(['one', 'two', 'three', 'four'])

    // empty string
    expect(matchTokens(''))
      .toEqual([])

    // non string
    expect(matchTokens(false))
      .toEqual([])
  })
})
