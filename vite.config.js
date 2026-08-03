import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { execSync } from 'child_process'

const commitCount = (() => {
  // 1. GitHub API — always reflects the real remote count, even on shallow clones
  if (process.env.GITHUB_TOKEN) {
    try {
      const headers = execSync(
        `curl -s -I ` +
        `-H "Authorization: Bearer ${process.env.GITHUB_TOKEN}" ` +
        `-H "Accept: application/vnd.github+json" ` +
        `"https://api.github.com/repos/Mipmapp/POGI-Points/commits?per_page=1"`,
        { timeout: 8000 }
      ).toString()
      // Link header contains: <...?page=N>; rel="last"  where N = total commits
      const match = headers.match(/[?&]page=(\d+)>;\s*rel="last"/i)
      if (match) {
        const count = parseInt(match[1], 10)
        console.log(`[vite] commit count from GitHub API: ${count}`)
        return count
      }
    } catch (e) {
      console.warn('[vite] GitHub API commit count failed, falling back:', e.message)
    }
  }
  // 2. Manual override (fallback when no token or API is unreachable)
  if (process.env.VITE_COMMIT_COUNT) {
    return parseInt(process.env.VITE_COMMIT_COUNT, 10)
  }
  // 3. Local git history (only accurate on full clones)
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
