import Path from 'crosspath'
import type { AssetConfig, AssetIndex, ResolvedAsset, SrcsetOptions } from '../../types'

export const defaultSrcsetOptions: SrcsetOptions = {
  pattern: '{name}@{scale}x.{ext}',
  scales: [2, 3],
  sizes: '(max-width: {width}px) 100vw, {width}px',
}

/**
 * Normalise user srcset config to options or false
 */
export function resolveSrcsetOptions (value: boolean | Partial<SrcsetOptions> | undefined): SrcsetOptions | false {
  if (value === false) {
    return false
  }
  const options = typeof value === 'object' ? value : {}
  return {
    ...defaultSrcsetOptions,
    ...options,
    scales: (options.scales || defaultSrcsetOptions.scales).filter(scale => Number(scale) > 1),
  }
}

/**
 * Interpolate a `{token}` template
 */
export function interpolate (template: string, tokens: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name) => name in tokens ? String(tokens[name]) : match)
}

/**
 * Get the index key of a scaled variant of an asset
 *
 * @param key       The index key of the base asset, i.e. 'posts/image.png'
 * @param scale     The scale multiplier
 * @param pattern   The naming pattern for variants
 */
export function getVariantKey (key: string, scale: number, pattern: string): string {
  const dir = Path.dirname(key)
  const ext = Path.extname(key)
  const name = Path.basename(key, ext)
  const file = interpolate(pattern, { name, scale, ext: ext.substring(1) })
  return dir === '.' ? file : `${dir}/${file}`
}

/**
 * Build `srcset` and `sizes` attributes for an asset that has scaled variants in the index
 *
 * Returns undefined if the asset has no width, or no variants
 */
export function getSrcset (key: string, asset: AssetConfig, index: AssetIndex, options: SrcsetOptions): Pick<ResolvedAsset, 'srcset' | 'sizes'> | undefined {
  const { width } = asset
  if (!width) {
    return
  }
  const candidates = [`${asset.srcAttr} ${width}w`]
  for (const scale of options.scales) {
    const variant = index[getVariantKey(key, scale, options.pattern)]
    if (variant) {
      candidates.push(`${variant.srcAttr} ${variant.width || Math.round(width * scale)}w`)
    }
  }
  if (candidates.length === 1) {
    return
  }
  const result: Pick<ResolvedAsset, 'srcset' | 'sizes'> = {
    srcset: candidates.join(', '),
  }
  if (options.sizes) {
    result.sizes = interpolate(options.sizes, { width })
  }
  return result
}
