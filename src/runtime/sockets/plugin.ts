import { defineNuxtPlugin, refreshNuxtData, useRuntimeConfig } from '#imports'
import type { AssetMessage } from '../../types'

/**
 * Client-side plugin to support asset live-reload
 */
export default defineNuxtPlugin(async () => {
  if (process.client) {
    // sockets url
    const url = useRuntimeConfig().public.sockets?.wsUrl

    // sockets
    const socket = await import('./setup')
      .then(({ setupSocketClient }) => {
        return setupSocketClient(url, 'content-assets')
      })

    // handler
    if (socket) {
      socket.addHandler(({ data }) => {
        // variables
        const { event, src, width, height } = data as AssetMessage

        // refresh
        if (event === 'refresh') {
          refreshNuxtData()
        }

        // update
        else if (src) {
          const isUpdate = event === 'update'
          document
            .querySelectorAll(`:is(img, video, source, embed, iframe):where([src^="${src}"])`)
            .forEach((el: any) => {
              // dim if deleted
              el.style.opacity = isUpdate ? '1' : '0.2'

              // otherwise, update
              if (isUpdate) {
                // prepare query
                const query = el.getAttribute('src').split('?')[1]
                const params = new URLSearchParams(query)
                params.set('time', String(Date.now()))

                // size
                if (width && height) {
                  // update size on load
                  el.addEventListener('load', function onLoad () {
                    if (el.width && el.height) {
                      el.setAttribute('width', width)
                      el.setAttribute('height', height)
                    }
                    if (el.style.aspectRatio) {
                      el.style.aspectRatio = `${width} / ${height}`
                    }
                    if (params.get('width')) {
                      params.set('width', width)
                      params.set('height', height)
                    }
                    el.removeEventListener('load', onLoad)
                  })
                }

                // src
                el.setAttribute('src', `${src}?${params.toString()}`)
              }
            })
        }
      })
    }
  }
})
