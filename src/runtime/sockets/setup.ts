import type { Callback, SocketInstance } from '../../types'
import { createWebSocket, type Logger } from './factory'

let client: ReturnType<typeof createWebSocket>

const plugin = '[Content Assets]'

const logger: Logger = {
  // eslint-disable-next-line no-console
  log: (...args: any[]) => console.log(plugin, ...args),
  // eslint-disable-next-line no-console
  warn: (...args: any[]) => console.warn(plugin, ...args)
}

export function setupSocketClient (url: string, channel: string, callback?: Callback): SocketInstance | null{
  if (!client) {
    client = createWebSocket(url, logger)
    if (client === null) {
      return null
    }
  }
  const instance: SocketInstance = {
    addHandler (callback: Callback) {
      if (client && typeof callback === 'function') {
        client.addHandler((data: any) => {
          if (data.channel === channel) {
            return callback(data)
          }
        })
      }
      return this
    },
    send (data: any) {
      if (client) {
        client.send({ channel, data })
      }
      return this
    },
  }

  // add handler
  if (callback) {
    instance.addHandler(callback)
  }

  // return
  return instance
}
