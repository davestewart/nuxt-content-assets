// must target utils/string; otherwise, circular dependency from utils/index!
import { matchTokens } from './utils/string'

export const defaults = {
  // inject image size into the rendered html
  imageSize: 'style',

  // treat these extensions as content
  contentExtensions: 'md csv ya?ml json',

  // output debug messages
  debug: false,
}

export const extensions = {
  // used to get image size
  image: matchTokens('png jpg jpeg gif svg webp ico'),

  // unused for now
  media: matchTokens('mp3 m4a wav mp4 mov webm ogg avi flv avchd'),
}

export function getIgnores (extensions: string | string[]): string {
  return `^((?!(${matchTokens(extensions).join('|')})).)*$`
}
