export type Callback = (data: any) => void

export interface SocketInstance {
  send: (data: any) => SocketInstance
  addHandler: (handler: Callback) => SocketInstance
}

export type ImageSize = Array<'style' | 'src' | 'url' | 'attrs'>

export type AssetConfig = {
  srcAttr: string
  content: string[],
  width?: number
  height?: number
}


export interface AssetMessage {
  event: 'update' | 'remove' | 'refresh'
  src?: string
  width?: string
  height?: string
}

export interface ParsedContent {
  /**
   * The storage id of the file
   * @example 'content:foo:bar:index.md'
   */
  _id: string

  /**
   * The source group identifier
   * @example 'content'
   */
  _source: string

  /**
   * The directory of the file under _source
   * @example 'foo'
   */
  _dir: string

  /**
   * The route to the file (excluding _source)
   * @example '/foo/bar'
   */
  _path: string

  /**
   * The file path of the file (excluding _source)
   * @example 'foo/bar/index.md'
   */
  _file: string

  /**
   * The type of the file
   * @example 'markdown'
   */
  _type: string

  /**
   * The file extension (excluding the dot)
   * @example 'md'
   */
  _extension: string

  /**
   * The AST structure
   * @example
   */
  body: {
    type: string,
    children: Array<any>
  }

  /**
   * Any other metadata key
   * @see https://content.nuxtjs.org/guide/writing/markdown/#native-parameters
   */
  [key: string | '_draft' | '_partial' | '_locale' | '_empty' | 'title' | 'description' | 'excerpt']: any
}
