import { useRuntimeConfig } from '#app'

const plugin = '[Content Assets]'
const logger = {
  // eslint-disable-next-line no-console
  log: (...args: any[]) => console.log(plugin, ...args),
  // eslint-disable-next-line no-console
  warn: (...args: any[]) => console.warn(plugin, ...args)
}

let ws: WebSocket | undefined

export function useSocket (channel: string, callback: (data: any) => void) {
  if (!window.WebSocket) {
    logger.warn('Unable to hot-reload images, your browser does not support WebSocket')
    return
  }

  const onOpen = () => logger.log('WS connected!')

  const onError = (e: any) => {
    switch (e.code) {
      case 'ECONNREFUSED':
        connect(true)
        break
      default:
        logger.warn('WS Error:', e)
        break
    }
  }

  const onClose = (e: any) => {
    // https://tools.ietf.org/html/rfc6455#section-11.7
    if (e.code === 1000 || e.code === 1005) {
      // normal close
      logger.log('WS closed!')
    }
    else {
      // unknown error
      connect(true)
    }
  }

  const onMessage = (message: any) => {
    try {
      const data = JSON.parse(message.data)
      if (channel === data.channel) {
        return callback(data)
      }
    }
    catch (err) {
      logger.warn('Error parsing message:', message.data)
    }
  }

  const send = (data: any) => {
    if (ws) {
      ws.send(JSON.stringify({ channel, data }))
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
      logger.log(`watching for image updates on ${wsUrl}`)

      // do it
      ws = new WebSocket(wsUrl)
      ws.onopen = onOpen
      ws.onmessage = onMessage
      ws.onerror = onError
      ws.onclose = onClose
    }
  }

  // automatically connect on use
  connect()

  return {
    connect,
    send,
  }
}
