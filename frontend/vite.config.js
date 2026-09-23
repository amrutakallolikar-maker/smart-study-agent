import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ include: /\.(js|jsx)$/ })],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5092',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  }
})
