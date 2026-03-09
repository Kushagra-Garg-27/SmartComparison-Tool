import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Custom plugin to transform manifest.json during build
const manifestPlugin = () => {
  return {
    name: "manifest-transform",
    generateBundle() {
      const manifestPath = resolve(__dirname, "manifest.json");
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      // Rewrite background script
      if (manifest.background?.service_worker) {
        manifest.background.service_worker =
          manifest.background.service_worker.replace(/\.ts$/, ".js");
      }

      // Rewrite content scripts
      if (manifest.content_scripts) {
        manifest.content_scripts = manifest.content_scripts.map(
          (script: any) => {
            if (script.js) {
              script.js = script.js.map((file: string) =>
                file.replace(/\.tsx?$/, ".js"),
              );
            }
            return script;
          },
        );
      }

      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
};

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, __dirname, "");

  return {
    plugins: [react(), manifestPlugin()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
      // Polyfill process for other libraries that might check it
      "process.env": JSON.stringify({}),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, "index.html"),
          panel: resolve(__dirname, "panel.html"),
          panelV2: resolve(__dirname, "panelV2.html"),
        },
        output: {
          format: "es",
          entryFileNames: "[name].js",
          chunkFileNames: "[name].js",
          assetFileNames: "[name].[ext]",
          manualChunks: {
            "vendor-chart": ["recharts"],
            "vendor-motion": ["framer-motion"],
            "vendor-three": [
              "three",
              "@react-three/fiber",
              "@react-three/drei",
            ],
            "vendor-gsap": ["gsap"],
          },
        },
      },
    },
  };
});
