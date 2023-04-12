import { Callback, SocketInstance } from '../../types'
import { createWebSocket } from './factory'

const client = createWebSocket()

export function setupSocketClient (channel: string, callback?: Callback): SocketInstance | null{
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
