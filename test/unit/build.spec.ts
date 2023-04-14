import { describe, it, expect } from 'vitest'
import { buildQuery, buildStyle } from '../../src/runtime/utils'

describe('builders', () => {
  describe('style', function () {
    it('should build styles', () => {
      // single style
      expect(buildStyle('padding: 25px'))
        .toBe('padding: 25px;')

      // multiple styles
      expect(buildStyle('color:red', 'padding: 25px'))
        .toBe('color:red; padding: 25px;')

      // mix of styles
      expect(buildStyle(';;  color:red;   padding: 25px', 'margin: none'))
        .toBe('color:red; padding: 25px; margin: none;')
    })
  })

  describe('query', function () {
    it('should build queries correctly', () => {
      // leading file
      expect(buildQuery('image.jpg', 'a=1', 'b=2'))
        .toBe('image.jpg?a=1&b=2')

      // leading file and query
      expect(buildQuery('image.jpg?a=1', '?b=2&', 'c=3&d=4'))
        .toBe('image.jpg?a=1&b=2&c=3&d=4')

      // query only
      expect(buildQuery('a=1', 'b=2'))
        .toBe('?a=1&b=2')
    })
  })
})
