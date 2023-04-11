import type { IncomingMessage } from 'http'
import { WebSocketServer } from 'ws'
import type { ListenOptions } from 'listhen'
import { listen } from 'listhen'
import { Nuxt } from '@nuxt/schema'

export type Callback = (data: any) => void

export type Handler = {
  channel: string
  callback: Callback
}

/**
 * WebSocket server useful for live content reload.
 */
export function createWebSocket () {
  const wss = new WebSocketServer({ noServer: true })

  const serve = (req: IncomingMessage, socket = req.socket, head: any = '') =>
    wss.handleUpgrade(req, socket, head, (client: any) => wss.emit('connection', client, req))

  const broadcast = (data: any, channel = '*') => {
    data = JSON.stringify({ channel, data })
    for (const client of wss.clients) {
      try {
        client.send(data)
      }
      catch (err) {
        /* Ignore error (if client not ready to receive event) */
      }
    }
  }

  const handlers: Handler[] = []
  const onMessage = (channel: string, callback: Callback) => {
    handlers.push({ channel, callback })
  }

  wss.on('connection', (client) => {
    client.addEventListener('message', event => {
      try {
        const { channel, data } = JSON.parse(event.data as string || '{}')
        handlers
          .filter(handler => handler.channel === channel || handler.channel === '*')
          .forEach(handler => handler.callback(data))
      }
      catch (err) {}
    })
  })

  return {
    wss,
    serve,
    broadcast,
    onMessage,
    close: () => {
      // disconnect all clients
      wss.clients.forEach((client: any) => client.close())
      // close the server
      return new Promise(resolve => wss.close(resolve))
    }
  }
}

// get web socket
const ws = createWebSocket()
let initialized = false

const defaults: Partial<ListenOptions> = {
  port: {
    port: 4001,
    portRange: [4001, 4040]
  },
  hostname: 'localhost',
  showURL: false
}

export function useSocketServer (nuxt: Nuxt, channel: string, onMessage?: Callback) {
  nuxt.hook('nitro:init', async (nitro) => {
    if (!initialized) {
      // set initialized
      initialized = true

      // listen dev server
      const { server, url } = await listen(() => 'Nuxt Sockets', defaults)

      // start server
      server.on('upgrade', ws.serve)

      // share URL
      nitro.options.runtimeConfig.public.sockets = {
        wsUrl: url.replace('http', 'ws')
      }

      // close on nuxt close
      nitro.hooks.hook('close', async () => {
        await ws.close()
        await server.close()
      })
    }
  })

  // return
  const instance = {
    send (data: any) {
      ws.broadcast(data, channel)
      return this
    },
    onMessage (callback: Callback) {
      ws.onMessage(channel, callback)
      return this
    }
  }

  // assign
  if (onMessage) {
    instance.onMessage(onMessage)
  }

  // return
  return instance
}
