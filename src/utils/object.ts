export type Callback = (value: any, parent?: any, key?: string | number) => void

export type Filter = (value: any, key?: string | number) => boolean | void

/**
 * Walk an object structure
 *
 * @param node
 * @param callback
 * @param filter
 */
export function walk (node: any, callback: Callback, filter?: Filter) {
  function visit (node: any, callback: Callback, parent?: any, key?: string | number) {
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
  visit(node, callback)
}

