import { useRuntimeConfig } from '#imports'
import { Callback } from '../../utils'

export function useSocketClient(channel: string, onMessage: Callback) {
  const url = useRuntimeConfig().public.sockets?.wsUrl
  if (process.client && url) {
    import('./composable').then(({ useSocket }) => {
      useSocket(channel, onMessage)
    })
  }
}
