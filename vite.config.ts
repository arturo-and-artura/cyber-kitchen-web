import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const previewAllowedHosts = (process.env.PREVIEW_ALLOWED_HOSTS ?? '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 4174,
    allowedHosts: previewAllowedHosts,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    css: true,
  },
})
