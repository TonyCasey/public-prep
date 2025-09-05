/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    css: false,
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['e2e/**/*', 'node_modules/**/*', 'dist/**/*', 'build/**/*'],
    alias: {
      '@': resolve(__dirname, './frontend/src'),
      '@shared': resolve(__dirname, './shared'),
      '@assets': resolve(__dirname, './frontend/src/assets'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './frontend/src'),
      '@shared': resolve(__dirname, './shared'),
      '@assets': resolve(__dirname, './frontend/src/assets'),
    },
  },
})