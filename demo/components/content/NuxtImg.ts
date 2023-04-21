import { h } from 'vue'
import NuxtImg from '../../node_modules/@nuxt/image-edge/dist/runtime/components/nuxt-img'

export default function render (attrs: Record<string, any>) {
  return h(NuxtImg, attrs)
}
