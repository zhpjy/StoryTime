import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  publicDir: fileURLToPath(new URL('../../content', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tss/schema': fileURLToPath(new URL('../../packages/schema/src/index.ts', import.meta.url)),
      '@tss/engine': fileURLToPath(new URL('../../packages/engine/src/index.ts', import.meta.url)),
      '@tss/validator': fileURLToPath(new URL('../../packages/validator/src/index.ts', import.meta.url)),
    },
  },
})
