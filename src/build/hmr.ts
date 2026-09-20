import type { Nuxt } from '@nuxt/schema'
import type { ViteDevServer } from 'vite'
import { type AssetMessage, HMR_EVENT } from '../types'

/**
 * Send asset updates to the browser over Vite's HMR channel
 */
export function setupHmr (nuxt: Nuxt) {
  let server: ViteDevServer | undefined

  nuxt.hook('vite:serverCreated', (viteServer, env) => {
    if (env.isClient) {
      server = viteServer
    }
  })

  return {
    send (data: AssetMessage) {
      const channel = (server as any)?.hot || server?.ws
      channel?.send({ type: 'custom', event: HMR_EVENT, data })
    },
  }
}
