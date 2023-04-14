import { describe, it, expect } from 'vitest'
import { buildQuery, buildStyle } from '../../src/runtime/utils'

describe('builders', () => {
  describe('style', function () {
    it('should build styles', () => {
      expect(buildStyle('color:red', 'padding: 25px'))
        .toBe('color:red; padding: 25px;')
      expect(buildStyle('padding: 25px'))
        .toBe('padding: 25px;')
    })
  })
  describe('query', function () {
    it('should build queries', () => {
      expect(buildQuery('image.jpg?a=1', '?b=2&', 'c=3&d=4'))
        .toBe('image.jpg?a=1&b=2&c=3&d=4')
      expect(buildQuery('image.jpg', 'a=1', 'b=2'))
        .toBe('image.jpg?a=1&b=2')
      expect(buildQuery('a=1', 'b=2'))
        .toBe('?a=1&b=2')
    })
  })
})
