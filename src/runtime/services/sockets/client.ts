import { useRuntimeConfig } from '#imports'
import { Callback } from '../../utils'

function onMessage ({ event, src }: { event: string, src: string }) {
  if (src) {
    const isUpdate = event === 'update'
    document
      .querySelectorAll(`img[src^="${src}"]`)
      .forEach((img) => {
        ;(img as HTMLElement).style.opacity = isUpdate ? '1' : '.2'
        if (isUpdate) {
          img.setAttribute('src', src)
        }
      })
  }
}

export function useSocketClient(channel: string, onMessage: Callback) {
  const url = useRuntimeConfig().public.sockets?.wsUrl
  if (process.client && url) {
    import('./composable').then(({ useSocket }) => {
      useSocket(channel, onMessage)
    })
  }
}
