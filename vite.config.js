import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Enable better error messages
          whitespace: 'preserve'
        }
      }
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    hmr: {
      overlay: true
    }
  },
  build: {
    // Enable better minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'app-utils': [
            '@/utils',
            '@/store'
          ]
        }
      }
    },
    // Enable source maps for production
    sourcemap: true,
    // Optimize CSS
    cssCodeSplit: true,
    // Enable asset optimization
    assetsInlineLimit: 4096,
    // Configure chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import "@/styles/variables.scss";
        `
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
    exclude: ['@vueuse/core']
  },
  envPrefix: 'VITE_',
  // Enable detailed build info
  stats: 'verbose',
  // Configure preview server
  preview: {
    port: 8080,
    strictPort: true,
    open: true
  }
});
