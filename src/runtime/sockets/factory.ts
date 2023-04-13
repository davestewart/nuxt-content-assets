import { useRuntimeConfig } from '#app'
import { Callback } from '../../types'

const plugin = '[Content Assets]'
const logger = {
  // eslint-disable-next-line no-console
  log: (...args: any[]) => console.log(plugin, ...args),
  // eslint-disable-next-line no-console
  warn: (...args: any[]) => console.warn(plugin, ...args)
}

let ws: WebSocket | undefined

export function createWebSocket () {
  if (!window.WebSocket) {
    logger.warn('Your browser does not support WebSocket')
    return null
  }

  const onOpen = () => logger.log('WS connected!')

  const onError = (e: any) => {
    switch (e.code) {
      case 'ECONNREFUSED':
        connect(true)
        break
      default:
        logger.warn('Socket error:', e)
        break
    }
  }

  const onClose = (e: any) => {
    // https://tools.ietf.org/html/rfc6455#section-11.7
    if (e.code === 1000 || e.code === 1005) {
      // normal close
      logger.log('Socket closed')
    }
    else {
      // unknown error
      connect(true)
    }
  }

  const handlers: Callback[] = []
  const onMessage = (message: any) => {
    let data: any
    try {
      data = JSON.parse(message.data)
    }
    catch (err) {
      logger.warn('Error parsing message:', message.data)
      return
    }
    handlers.forEach(handler => handler(data))
  }

  const send = (data: any) => {
    if (ws) {
      ws.send(JSON.stringify(data))
    }
  }

  const connect = (retry = false) => {
    if (retry) {
      logger.log('WS reconnecting..')
      setTimeout(connect, 1000)
      return
    }

    if (ws) {
      try {
        ws.close()
      }
      catch (err) {
        // empty
      }
      ws = undefined
    }

    // websocket base url
    const url = useRuntimeConfig().public.sockets?.wsUrl
    if (url) {
      const wsUrl = `${url}ws`

      // debug
      logger.log(`Running on ${wsUrl}`)

      // do it
      ws = new WebSocket(wsUrl)
      ws.onopen = onOpen
      ws.onmessage = onMessage
      ws.onerror = onError
      ws.onclose = onClose
    }
  }

  // automatically connect on use
  if (!ws) {
    connect()
  }

  return {
    send,
    addHandler (callback: Callback) {
      if (typeof callback === 'function') {
        handlers.push(callback)
      }
    },
  }
}
