import { defineNuxtPlugin } from '#imports'
import { type AssetMessage, HMR_EVENT } from '../types'

/**
 * Client-side plugin to support asset live-reload (development only)
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.hot || !import.meta.client) {
    return
  }

  import.meta.hot.on(HMR_EVENT, (data: AssetMessage) => {
    const { event, src, width, height } = data
    if (!src) {
      return
    }
    const isUpdate = event === 'update'
    const time = String(Date.now())
    const selector = `:is(img, video, source, embed, iframe):where([src*="${src}"], [srcset*="${src}"])`

    document.querySelectorAll(selector).forEach((el: any) => {
      // dim if deleted
      el.style.opacity = isUpdate ? '1' : '0.2'
      if (!isUpdate) {
        return
      }

      // update size on load
      if (width && height) {
        el.addEventListener('load', function onLoad () {
          if (el.getAttribute('width') && el.getAttribute('height')) {
            el.setAttribute('width', String(width))
            el.setAttribute('height', String(height))
          }
          if (el.style.aspectRatio) {
            el.style.aspectRatio = `${width} / ${height}`
          }
          el.removeEventListener('load', onLoad)
        })
      }

      // bust src (nuxt image serves from /_ipx/..., so keep whatever path is there)
      const [path, query] = String(el.getAttribute('src') || '').split('?')
      const params = new URLSearchParams(query)
      params.set('time', time)
      if (width && height && params.get('width')) {
        params.set('width', String(width))
        params.set('height', String(height))
      }
      el.setAttribute('src', `${path}?${params.toString()}`)

      // bust srcset
      const srcset = el.getAttribute('srcset')
      if (srcset) {
        el.setAttribute('srcset', srcset.replace(/(\S+)(\s+\S+)?/g, (_match: string, url: string, descriptor = '') => {
          const [base, q] = url.split('?')
          const p = new URLSearchParams(q)
          p.set('time', time)
          return `${base}?${p.toString()}${descriptor}`
        }))
      }
    })
  })
})
