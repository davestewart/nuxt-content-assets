// ---------------------------------------------------------------------------------------------------------------------
// module
// ---------------------------------------------------------------------------------------------------------------------

export interface ModuleOptions {
  /**
   * Image size hints to inject into rendered images
   *
   * One or more of `style`, `attrs`, `src`
   *
   * @example 'style attrs'
   * @default ''
   */
  imageSize?: string | string[] | false

  /**
   * File extensions to treat as content; anything else is treated as an asset
   *
   * Tokens may use simple regex fragments
   *
   * @example 'mdx? csv ya?ml json fire'
   * @default 'mdx? csv ya?ml json'
   */
  contentExtensions?: string | string[]

  /**
   * Generate `srcset` and `sizes` attributes for images that have high resolution variants
   *
   * Pass `true` for defaults, an options object to customise, or `false` to disable
   *
   * @default true
   */
  srcset?: boolean | Partial<SrcsetOptions>

  /**
   * Display debug messages
   *
   * @default false
   */
  debug?: boolean
}

export interface SrcsetOptions {
  /**
   * Naming pattern for high resolution variants
   *
   * Tokens: `{name}` base filename, `{scale}` multiplier, `{ext}` extension
   *
   * @default '{name}@{scale}x.{ext}'
   */
  pattern: string

  /**
   * Scale multipliers to look for
   *
   * @default [2, 3]
   */
  scales: number[]

  /**
   * Template for the `sizes` attribute, or `false` to omit
   *
   * Tokens: `{width}` the base image's intrinsic width
   *
   * @default '(max-width: {width}px) 100vw, {width}px'
   */
  sizes: string | false
}

// ---------------------------------------------------------------------------------------------------------------------
// assets
// ---------------------------------------------------------------------------------------------------------------------

export type ImageSize = Array<'style' | 'attrs' | 'src'>

/**
 * A single asset, keyed in the index by its path relative to the public folder
 */
export interface AssetConfig {
  /**
   * The absolute web path to the asset
   * @example '/content/posts/image.jpg'
   */
  srcAttr: string
  width?: number
  height?: number
}

/**
 * A resolved asset, including any image variants
 */
export interface ResolvedAsset extends AssetConfig {
  srcset?: string
  sizes?: string
}

/**
 * Index of assets, written by the build process
 */
export type AssetIndex = Record<string, AssetConfig>

/**
 * Index of which documents reference which assets, written by the server process
 */
export interface ContentIndex {
  /**
   * Asset paths which resolved, and the ids of the documents that referenced them
   */
  hits: Record<string, string[]>

  /**
   * Asset paths which did not resolve, and the ids of the documents that referenced them
   */
  misses: Record<string, string[]>
}

export interface AssetMessage {
  event: 'update' | 'remove'
  src: string
  width?: number
  height?: number
}

// ---------------------------------------------------------------------------------------------------------------------
// content
// ---------------------------------------------------------------------------------------------------------------------

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
   */
  body: {
    type: string
    children: Array<any>
  }

  /**
   * Any other metadata key
   * @see https://content.nuxtjs.org/guide/writing/markdown/#native-parameters
   */
  [key: string]: any
}

// ---------------------------------------------------------------------------------------------------------------------
// sockets
// ---------------------------------------------------------------------------------------------------------------------

export type Callback = (data: any) => void

export interface SocketInstance {
  send: (data: any) => SocketInstance
  addHandler: (handler: Callback) => SocketInstance
}
