export type Callback = (data: any) => void

export type Handler = {
  channel: string
  callback: Callback
}

export interface SocketInstance {
  send: (data: any) => SocketInstance
  addHandler: (handler: Callback) => SocketInstance
}
