import { Server } from 'http'
import { listen } from 'listhen'
import { useNuxt } from '@nuxt/kit'
import { Callback, SocketInstance } from '../../types'
import { createWebSocket } from './factory'
import { isObject, log } from '../../runtime/utils'

type SocketServer = ReturnType<typeof createWebSocket>

type Handler = {
  channel: string
  callback: Callback
}

function makeChannelBroker (ws: SocketServer) {
  const handlers: Handler[] = []

  const broadcast = (channel: string, data: any) => {
    ws.broadcast({ channel, data })
  }

  const addHandler = (channel: string, callback: Callback) => {
    handlers.push({ channel, callback })
  }

  ws.addHandler(function (message: any) {
    if (isObject(message)) {
      const { channel } = message
      handlers
        .filter(handler => handler.channel === channel || handler.channel === '*')
        .forEach(handler => handler.callback(message))
    }
  })

  return {
    broadcast,
    addHandler,
  }
}

const ws = createWebSocket()

const broker = makeChannelBroker(ws)

export async function setupSocketServer (channel: string, handler?: Callback): Promise<SocketInstance> {
  const nuxt = useNuxt()
  nuxt.hook('nitro:init', async (nitro) => {
    if (!nuxt._socketServer) {
      // server
      const defaults = nuxt.options.runtimeConfig.content.watch.ws
      const port = defaults.port.port
      const { server, url } = await listen(() => 'Nuxt Content Assets', {
        hostname: defaults.hostname,
        port: {
          port:  port + 1,
          portRange: [
            port + 1, port + 40
          ],
        },
        showURL: false
      })

      // set initialized
      nuxt._socketServer = server

      // start server
      server.on('upgrade', ws.serve)

      // share URL
      const wsUrl = url.replace('http', 'ws')
      log(`Websocket listening on "${wsUrl}"`)
      nitro.options.runtimeConfig.public.sockets = {
        wsUrl
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
      broker.broadcast(channel, data)
      return this
    },
    addHandler (callback: Callback) {
      broker.addHandler(channel, callback)
      return this
    }
  }

  // assign
  if (handler) {
    instance.addHandler(handler)
  }

  // return
  return instance
}

declare module '@nuxt/schema' {
  interface Nuxt {
    _socketServer: Server
  }
}
