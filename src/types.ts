export type Callback = (data: any) => void

export type Handler = {
  channel: string
  callback: Callback
}

export interface SocketInstance {
  send: (data: any) => SocketInstance
  addHandler: (handler: Callback) => SocketInstance
}

export interface ParsedContent {
  [key: string]: any

  _path: string
  _dir: string
  _draft: boolean
  _partial: boolean
  _locale: string
  _empty: boolean
  _type: string
  _id: string
  _source: string
  _file: string
  _extension: string
  title?: string
  description?: string
  excerpt?: string
  body: any
}
