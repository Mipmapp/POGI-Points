// vite.config.js
import { defineConfig } from "file:///C:/Users/Jullan/OneDrive/Documents/Code%20Projects/POGI-Points/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/Jullan/OneDrive/Documents/Code%20Projects/POGI-Points/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\Jullan\\OneDrive\\Documents\\Code Projects\\POGI-Points";
var vite_config_default = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    proxy: {
      "/apis": {
        target: "https://ssaam-api.vercel.app",
        changeOrigin: true,
        secure: false,
        rewrite: (path2) => {
          console.log(`[Proxy] Routing ${path2} to https://ssaam-api.vercel.app${path2}`);
          return path2;
        }
      }
    },
    // Increase max request size and add timeout
    middlewareMode: false,
    corsUseCredentials: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKdWxsYW5cXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXENvZGUgUHJvamVjdHNcXFxcUE9HSS1Qb2ludHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEp1bGxhblxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcQ29kZSBQcm9qZWN0c1xcXFxQT0dJLVBvaW50c1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSnVsbGFuL09uZURyaXZlL0RvY3VtZW50cy9Db2RlJTIwUHJvamVjdHMvUE9HSS1Qb2ludHMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbdnVlKCldLFxyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogJzAuMC4wLjAnLFxyXG4gICAgcG9ydDogNTAwMCxcclxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL3NzYWFtLWFwaS52ZXJjZWwuYXBwJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYFtQcm94eV0gUm91dGluZyAke3BhdGh9IHRvIGh0dHBzOi8vc3NhYW0tYXBpLnZlcmNlbC5hcHAke3BhdGh9YCk7XHJcbiAgICAgICAgICByZXR1cm4gcGF0aDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvLyBJbmNyZWFzZSBtYXggcmVxdWVzdCBzaXplIGFuZCBhZGQgdGltZW91dFxyXG4gICAgbWlkZGxld2FyZU1vZGU6IGZhbHNlLFxyXG4gICAgY29yc1VzZUNyZWRlbnRpYWxzOiB0cnVlXHJcbiAgfVxyXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBc1gsU0FBUyxvQkFBb0I7QUFDblosT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDZixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxPQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTLENBQUNBLFVBQVM7QUFDakIsa0JBQVEsSUFBSSxtQkFBbUJBLEtBQUksbUNBQW1DQSxLQUFJLEVBQUU7QUFDNUUsaUJBQU9BO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLGdCQUFnQjtBQUFBLElBQ2hCLG9CQUFvQjtBQUFBLEVBQ3RCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicGF0aCJdCn0K
