import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.data/**', '**/.nuxt/**', '**/.output/**'],
  },
})
