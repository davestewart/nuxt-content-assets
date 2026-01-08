import type { Callback } from '../../types'

export interface Logger {
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
}

let ws: WebSocket | undefined

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function log (...args: any[]) {}

export function createWebSocket (url: string, logger: Logger = { log, warn: log }) {
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
    catch {
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

  let retries = 0
  const connect = (retry = false) => {
    if (retry) {
      retries++
      if (retries < 5) {
        logger.log('Reconnecting...')
        setTimeout(connect, 1000)
      }
      else {
        logger.warn('Giving up!')
      }
      return
    }

    if (ws) {
      try {
        ws.close()
      }
      catch {
        // empty
      }
      ws = undefined
    }

    // websocket base url
    if (url) {
      const wsUrl = `${url}ws`

      // debug
      logger.log(`WS connect to ${wsUrl}`)

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
    connect,
    send,
    addHandler (callback: Callback) {
      if (typeof callback === 'function') {
        handlers.push(callback)
      }
    },
  }
}
