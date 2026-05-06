import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@tss/schema': resolvePath('./packages/schema/src/index.ts'),
      '@tss/engine': resolvePath('./packages/engine/src/index.ts'),
      '@tss/validator': resolvePath('./packages/validator/src/index.ts'),
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
    include: ['scripts/**/*.test.ts', 'apps/**/*.test.ts', 'packages/**/*.test.ts'],
  },
})
