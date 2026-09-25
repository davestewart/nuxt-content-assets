import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
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
          // fixtures share the module's `cache/public` folder, so run files one at a time
          pool: 'forks',
          poolOptions: {
            forks: { singleFork: true },
          },
        },
      },
    ],
  },
})
