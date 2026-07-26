import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
export default defineConfig({
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
        target: 'https://ssaam-api.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          console.log(`[Proxy] Routing ${path} → ssaam-api.vercel.app`)
          return path
        }
      }
    },
    middlewareMode: false,
    corsUseCredentials: true
  }
})
