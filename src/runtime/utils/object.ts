export type Walkable = { [key: string | number]: any }

export type WalkFilter = (value: any, key?: string | number) => boolean | void

export type WalkCallback = (value: any, parent: Walkable, key: string | number) => void

/**
 * Walk an object structure
 *
 * @param node
 * @param callback
 * @param filter
 */
export function walk (node: any, callback: WalkCallback, filter?: WalkFilter): void {
  function visit (node: any, callback: WalkCallback, parent: Walkable, key: string | number) {
    // filter
    if (filter) {
      const result = filter(node, key)
      if (result === false) {
        return
      }
    }

    // branch
    if (Array.isArray(node)) {
      node.forEach((value, index) => {
        visit(value, callback, node, index)
      })
    }
    else if (typeof node === 'object' && node !== null) {
      Object.keys(node).forEach(key => {
        visit(node[key], callback, node, key)
      })
    }

    // leaf
    else {
      callback(node, parent, key)
    }
  }

  // begin
  visit(node, callback, { node }, 'node')
}

