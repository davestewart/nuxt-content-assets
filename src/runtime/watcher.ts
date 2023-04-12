import { defineNuxtPlugin } from '#imports'
import { useSocketClient } from './services/sockets/client'

interface AssetMessage {
  event: string
  src: string
}

export default defineNuxtPlugin(async () => {
  if (process.client) {
    void useSocketClient('content-assets', ({ data }) => {
      const { event, src } = data as AssetMessage
      if (src) {
        const isUpdate = event === 'update'
        document
          .querySelectorAll(`img[src^="${src}"]`)
          .forEach((el: Element) => {
            const img = el as HTMLImageElement
            img.style.opacity = isUpdate ? '1' : '0.2'
            if (isUpdate) {
              img.setAttribute('src', `${src}?${new Date().getTime()}`)
            }
          })
      }
    })
  }
})
