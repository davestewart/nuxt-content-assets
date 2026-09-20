import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: false,
  },
})
  .append({
    ignores: [
      'dist',
      'cache',
      'playground/.nuxt',
      'playground/.output',
      'test/fixtures/**/.nuxt',
      'test/fixtures/**/.output',
    ],
  })
  .append({
    files: ['playground/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  })
  .append({
    files: ['src/**/*.ts', 'test/**/*.ts'],
    rules: {
      // the module logs intentionally
      'no-console': 'off',
      // build-time code is allowed to use any
      '@typescript-eslint/no-explicit-any': 'off',
      // the module manipulates index maps keyed by path
      '@typescript-eslint/no-dynamic-delete': 'off',
    },
  })
