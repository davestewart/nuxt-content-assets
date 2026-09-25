import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // e2e fixtures share the module's `cache` folder, so run files one at a time (each in its own process)
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.spec.ts'],
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.spec.ts'],
          // fixtures build and start a full Nuxt app
          testTimeout: 120_000,
          hookTimeout: 300_000,
        },
      },
    ],
  },
})
