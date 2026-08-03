import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { execSync } from 'child_process'

const commitCount = (() => {
  try {
    return parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
  } catch {
    return 0
  }
})()

export default defineConfig({
  define: {
    __COMMIT_COUNT__: commitCount,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  plugins: [
    vue(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/apis': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          console.log(`[Proxy] Routing ${path} → localhost:3001`)
          return path
        }
      },
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
    middlewareMode: false,
    corsUseCredentials: true
  }
})
