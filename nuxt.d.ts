import { ModuleOptions } from '@nuxt/content'

// this shouldn't be needed as @nuxt/content has this...
declare module '@nuxt/schema' {
  interface NuxtOptions { ['content']?: ModuleOptions }
}
