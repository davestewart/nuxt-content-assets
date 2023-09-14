import { h } from 'vue'
import NuxtImg from '../../node_modules/@nuxt/image/dist/runtime/components/nuxt-img.mjs'

export default function render (attrs: Record<string, any>) {
  return h(NuxtImg, attrs)
}
