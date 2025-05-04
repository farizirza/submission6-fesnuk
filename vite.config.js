import { defineConfig } from "vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "public"),
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: true, // Listen on all local IPs
    strictPort: true, // If port is already in use, exit instead of trying another
    hmr: {
      // Fix WebSocket connection issues
      clientPort: null, // Use the same port as the server
      overlay: true, // Show errors as overlay
    },
  },
});
