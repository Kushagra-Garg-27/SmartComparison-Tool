import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Proxy API requests to SmartComparison-Tool backend in dev
      "/products": "http://localhost:3001",
      "/price-history": "http://localhost:3001",
      "/deals": "http://localhost:3001",
      "/watchlist": "http://localhost:3001",
      "/notifications": "http://localhost:3001",
      "/ai": "http://localhost:3001",
      "/health": "http://localhost:3001",
    },
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
