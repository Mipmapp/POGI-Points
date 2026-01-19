// vite.config.js
import { defineConfig } from "file:///C:/Users/Jullan/OneDrive/Documents/Code%20Projects/POGI-Points/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/Jullan/OneDrive/Documents/Code%20Projects/POGI-Points/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var vite_config_default = defineConfig({
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
        rewrite: (path) => {
          console.log(`[Proxy] Routing ${path} to https://ssaam-api.vercel.app${path}`);
          return path;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxKdWxsYW5cXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXENvZGUgUHJvamVjdHNcXFxcUE9HSS1Qb2ludHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEp1bGxhblxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcQ29kZSBQcm9qZWN0c1xcXFxQT0dJLVBvaW50c1xcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSnVsbGFuL09uZURyaXZlL0RvY3VtZW50cy9Db2RlJTIwUHJvamVjdHMvUE9HSS1Qb2ludHMvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW3Z1ZSgpXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgIHBvcnQ6IDUwMDAsXHJcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FwaXMnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9zc2FhbS1hcGkudmVyY2VsLmFwcCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbUHJveHldIFJvdXRpbmcgJHtwYXRofSB0byBodHRwczovL3NzYWFtLWFwaS52ZXJjZWwuYXBwJHtwYXRofWApO1xyXG4gICAgICAgICAgcmV0dXJuIHBhdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gSW5jcmVhc2UgbWF4IHJlcXVlc3Qgc2l6ZSBhbmQgYWRkIHRpbWVvdXRcclxuICAgIG1pZGRsZXdhcmVNb2RlOiBmYWxzZSxcclxuICAgIGNvcnNVc2VDcmVkZW50aWFsczogdHJ1ZVxyXG4gIH1cclxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQXNYLFNBQVMsb0JBQW9CO0FBQ25aLE9BQU8sU0FBUztBQUVoQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDZixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxPQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTLENBQUMsU0FBUztBQUNqQixrQkFBUSxJQUFJLG1CQUFtQixJQUFJLG1DQUFtQyxJQUFJLEVBQUU7QUFDNUUsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsZ0JBQWdCO0FBQUEsSUFDaEIsb0JBQW9CO0FBQUEsRUFDdEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
