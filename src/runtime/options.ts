// must target utils/string; otherwise, circular dependency!
import { matchWords } from './utils/string'

export const defaults = {
  assetsDir: '/assets/',
  assetsPattern: '[path]/[file]'
}

export const tags = ['img', 'video', 'audio', 'source', 'embed', 'iframe', 'a']

export const extensions = {
  image: matchWords('png jpg jpeg gif svg webp ico'),
  media: matchWords('mp3 m4a wav mp4 mov webm ogg avi flv avchd'),
}
