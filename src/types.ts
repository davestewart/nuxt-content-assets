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
   * File extensions to treat as content; anything else found in a collection's source folder is treated as an asset
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
// sources
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A folder of content whose non-content files should be treated as assets
 */
export interface AssetSource {
  /**
   * The absolute path to the folder
   */
  dir: string

  /**
   * The web path prefix assets in this folder are served under
   * @example '/blog'
   */
  prefix: string

  /**
   * Glob patterns (relative to `dir`) to exclude
   */
  exclude: string[]

  /**
   * Whether the folder is populated by Nuxt Content from a git repository
   */
  remote: boolean
}

// ---------------------------------------------------------------------------------------------------------------------
// assets
// ---------------------------------------------------------------------------------------------------------------------

export type ImageSize = Array<'style' | 'attrs' | 'src'>

/**
 * A single copied asset
 */
export interface AssetConfig {
  /**
   * The absolute web path to the asset
   * @example '/blog/posts/image.jpg'
   */
  srcAttr: string

  /**
   * The absolute path to the copied file
   */
  target: string

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
 * Message sent to the browser when an asset changes
 */
export interface AssetMessage {
  event: 'update' | 'remove'
  src: string
  width?: number
  height?: number
}

export const HMR_EVENT = 'nuxt-content-assets:update'
