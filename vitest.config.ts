import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [Vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', '.nuxt', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.nuxt/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    setupFiles: ['./tests/setup.ts'],
    mockReset: true,
    restoreMocks: true
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname),
      '~~': resolve(__dirname),
      '@@': resolve(__dirname)
    }
  }
})