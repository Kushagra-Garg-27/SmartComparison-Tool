import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: false, // ⬅ DO NOT wipe popup/background
    rollupOptions: {
      input: resolve(__dirname, "content.tsx"),
      output: {
        format: "iife", // ✅ NO imports
        entryFileNames: "content.js",
      },
    },
  },
});
