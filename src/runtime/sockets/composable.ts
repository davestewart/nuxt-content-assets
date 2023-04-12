import { useRuntimeConfig } from '#imports'
import { Callback, SocketInstance } from '../../types'

export function useSockets (channel: string, callback?: Callback): Promise<SocketInstance | null> {
  const url = useRuntimeConfig().public.sockets?.wsUrl
  return new Promise(function (resolve) {
    if (process.client && url) {
      return import('./setup').then(({ setupSocketClient }) => {
        return resolve(setupSocketClient(channel, callback))
      })
    }
    resolve(null)
  })
}
