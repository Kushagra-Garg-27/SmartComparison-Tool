import { defineConfig, loadEnv } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");

  return {
    define: {
      "process.env.API_KEY": JSON.stringify(env.VITE_GEMINI_API_KEY),
      "process.env": JSON.stringify({}),
    },
    build: {
      outDir: "dist",
      emptyOutDir: false,
      rollupOptions: {
        input: resolve(__dirname, "background.ts"),
        output: {
          format: "es",
          entryFileNames: "background.js",
          // Inline all dependencies — no shared chunks that could pull in DOM code
          inlineDynamicImports: true,
        },
      },
    },
  };
});
