// vite.config.js
import { defineConfig, loadEnv } from "file:///Users/chicali/code/ImaGenCALI/.yarn/__virtual__/vite-virtual-22178bd6c2/3/.yarn/berry/cache/vite-npm-5.4.11-9da365ef2b-10c0.zip/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/chicali/code/ImaGenCALI/.yarn/__virtual__/@vitejs-plugin-vue-virtual-8fd4145a6e/3/.yarn/berry/cache/@vitejs-plugin-vue-npm-5.2.1-25d60c16d1-10c0.zip/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///Users/chicali/code/ImaGenCALI/vite.config.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    },
    define: {
      "import.meta.env.HUGGINGFACE_API_KEY": JSON.stringify(env.HUGGINGFACE_API_KEY),
      "import.meta.env.R2_ACCESS_KEY_ID": JSON.stringify(env.R2_ACCESS_KEY_ID),
      "import.meta.env.R2_SECRET_ACCESS_KEY": JSON.stringify(env.R2_SECRET_ACCESS_KEY),
      "import.meta.env.R2_BUCKET_NAME": JSON.stringify(env.R2_BUCKET_NAME),
      "process.env": {}
    },
    server: {
      port: 8081,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2hpY2FsaS9jb2RlL0ltYUdlbkNBTElcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9jaGljYWxpL2NvZGUvSW1hR2VuQ0FMSS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvY2hpY2FsaS9jb2RlL0ltYUdlbkNBTEkvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCksICcnKTtcbiAgXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKVxuICAgICAgfVxuICAgIH0sXG4gICAgZGVmaW5lOiB7XG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LkhVR0dJTkdGQUNFX0FQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuSFVHR0lOR0ZBQ0VfQVBJX0tFWSksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlIyX0FDQ0VTU19LRVlfSUQnOiBKU09OLnN0cmluZ2lmeShlbnYuUjJfQUNDRVNTX0tFWV9JRCksXG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlIyX1NFQ1JFVF9BQ0NFU1NfS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LlIyX1NFQ1JFVF9BQ0NFU1NfS0VZKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuUjJfQlVDS0VUX05BTUUnOiBKU09OLnN0cmluZ2lmeShlbnYuUjJfQlVDS0VUX05BTUUpLFxuICAgICAgJ3Byb2Nlc3MuZW52Jzoge31cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogODA4MSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFEsU0FBUyxjQUFjLGVBQWU7QUFDbFQsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZSxXQUFXO0FBRmlJLElBQU0sMkNBQTJDO0FBSXJOLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsSUFDZixTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQ3REO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sdUNBQXVDLEtBQUssVUFBVSxJQUFJLG1CQUFtQjtBQUFBLE1BQzdFLG9DQUFvQyxLQUFLLFVBQVUsSUFBSSxnQkFBZ0I7QUFBQSxNQUN2RSx3Q0FBd0MsS0FBSyxVQUFVLElBQUksb0JBQW9CO0FBQUEsTUFDL0Usa0NBQWtDLEtBQUssVUFBVSxJQUFJLGNBQWM7QUFBQSxNQUNuRSxlQUFlLENBQUM7QUFBQSxJQUNsQjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
