import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import type { AssetMessage } from '../../types'

/**
 * Client-side plugin to support asset live-reload
 */
export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    // sockets url
    const url = (useRuntimeConfig().public as any).sockets?.wsUrl as string | undefined

    // sockets
    const socket = await import('./setup')
      .then(({ setupSocketClient }) => {
        return url ? setupSocketClient(url, 'content-assets') : null
      })

    // handler
    if (socket) {
      socket.addHandler(({ data }) => {
        // variables
        const { event, src, width, height } = data as AssetMessage

        if (src) {
          const isUpdate = event === 'update'
          const selector = `:is(img, video, source, embed, iframe):where([src*="${src}"], [srcset*="${src}"])`
          document
            .querySelectorAll(selector)
            .forEach((el: any) => {
              // dim if deleted
              el.style.opacity = isUpdate ? '1' : '0.2'

              // otherwise, update
              if (isUpdate) {
                // prepare query
                const time = String(Date.now())
                const [path, query] = String(el.getAttribute('src')).split('?')
                const params = new URLSearchParams(query)
                params.set('time', time)

                // size
                if (width && height) {
                  // update size on load
                  el.addEventListener('load', function onLoad () {
                    if (el.width && el.height) {
                      el.setAttribute('width', String(width))
                      el.setAttribute('height', String(height))
                    }
                    if (el.style.aspectRatio) {
                      el.style.aspectRatio = `${width} / ${height}`
                    }
                    if (params.get('width')) {
                      params.set('width', String(width))
                      params.set('height', String(height))
                    }
                    el.removeEventListener('load', onLoad)
                  })
                }

                // src (nuxt image serves from /_ipx/..., so keep whatever path is there)
                el.setAttribute('src', `${path}?${params.toString()}`)

                // srcset
                const srcset = el.getAttribute('srcset')
                if (srcset) {
                  el.setAttribute('srcset', srcset.replace(/(\S+)(\s+\S+)?/g, (match: string, url: string, descriptor = '') => {
                    const [base, q] = url.split('?')
                    const p = new URLSearchParams(q)
                    p.set('time', time)
                    return `${base}?${p.toString()}${descriptor}`
                  }))
                }
              }
            })
        }
      })
    }
  }
})
