import { Server } from 'http'
import { useNuxt } from '@nuxt/kit'
import { listen, ListenOptions } from 'listhen'
import { Callback, SocketInstance, Handler } from '../../types'
import { createWebSocket } from './factory'

type SocketServer = ReturnType<typeof createWebSocket>

function isObject (data: any) {
  return data && typeof data === 'object' && !Array.isArray(data)
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

let initialized = false

const ws = createWebSocket()

const broker = makeChannelBroker(ws)

const defaults: Partial<ListenOptions> = {
  port: {
    port: 4001,
    portRange: [4001, 4040]
  },
  hostname: 'localhost',
  showURL: false
}

export async function setupSocketServer (channel: string, handler?: Callback): Promise<SocketInstance> {
  const nuxt = useNuxt()
  nuxt.hook('nitro:init', async (nitro) => {
    if (!nuxt._socketServer) {
      // server
      const { server, url } = await listen(() => 'Nuxt Sockets', defaults)

      // set initialized
      nuxt._socketServer = server

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
