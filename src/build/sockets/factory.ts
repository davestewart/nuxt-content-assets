import type { IncomingMessage } from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import { Callback } from '../../types'

/**
 * WebSocket Server
 * @see https://www.npmjs.com/package/ws
 */
export function createWebSocket () {
  const wss = new WebSocketServer({ noServer: true })

  const serve = (req: IncomingMessage, socket = req.socket, head: any = '') =>
    wss.handleUpgrade(req, socket, head, (client: any) => wss.emit('connection', client, req))

  const broadcast = (data: any) => {
    data = JSON.stringify(data)
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    }
  }

  const handlers: Callback[] = []
  const addHandler = (callback: Callback) => {
    handlers.push(callback)
  }

  wss.on('connection', (socket) => {
    socket.addEventListener('message', event => {
      let data: any
      try {
        data = JSON.parse(event.data as string || '{}')
      }
      catch (err) {
        // empty
      }
      if (data) {
        handlers.forEach(callback => callback(data))
      }
    })
  })

  return {
    wss,
    serve,
    broadcast,
    addHandler,
    close: () => {
      // disconnect all clients
      wss.clients.forEach((client: any) => client.close())
      // close the server
      return new Promise(resolve => wss.close(resolve))
    }
  }
}
