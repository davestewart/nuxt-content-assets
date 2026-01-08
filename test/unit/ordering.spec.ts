import { describe, it, expect } from 'vitest'
import { removeOrdering } from '../../src/runtime/utils/path'

describe('ordering', () => {
    it('should remove ordering from paths', () => {
        // simple
        expect(removeOrdering('1.foo/bar.jpg')).toBe('foo/bar.jpg')

        // nested
        expect(removeOrdering('1.foo/2.bar/baz.jpg')).toBe('foo/bar/baz.jpg')

        // deeply nested
        expect(removeOrdering('1.foo/2.bar/3.baz/qux.jpg')).toBe('foo/bar/baz/qux.jpg')

        // no ordering
        expect(removeOrdering('foo/bar.jpg')).toBe('foo/bar.jpg')

        // mixed
        expect(removeOrdering('1.foo/bar/2.baz.jpg')).toBe('foo/bar/baz.jpg')

        // ordering in filename (should be removed as per current regex)
        expect(removeOrdering('foo/1.bar.jpg')).toBe('foo/bar.jpg')
    })
})
