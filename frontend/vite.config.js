import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves from /smart-study-agent/ — use '/' if using a custom domain
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react({ include: /\.(js|jsx)$/ })],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  }
})
