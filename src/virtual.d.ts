/**
 * Build-time configuration injected into the Nitro plugin via a virtual module
 *
 * @see src/module.ts
 */
declare module '#nuxt-content-assets' {
  import type { ImageSize, SrcsetOptions } from './types'

  export const publicPath: string
  export const imageSizes: ImageSize
  export const srcset: SrcsetOptions | false
  export const contentExtensions: string
  export const debug: boolean
}
