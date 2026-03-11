/**
 * SmartCompare Chrome Extension — esbuild Build Script
 *
 * Bundles TypeScript source into Chrome-extension-compatible JS.
 * Output goes to dist/ which is the unpacked extension directory.
 *
 * Usage:
 *   node build.mjs            # one-shot build
 *   node build.mjs --watch    # watch mode for development
 */

import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes("--watch");

const distDir = resolve(__dirname, "dist");

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });

// --- Common esbuild options ---
const commonOptions = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch,
  target: "chrome120",
  logLevel: "info",
};

// --- Build entries ---
const entries = [
  {
    entryPoints: [resolve(__dirname, "src/background.ts")],
    outfile: resolve(distDir, "background.js"),
    format: "esm",
  },
  {
    entryPoints: [resolve(__dirname, "src/content.ts")],
    outfile: resolve(distDir, "content.js"),
    format: "iife", // Content scripts must be IIFE — no ES modules
  },
  {
    entryPoints: [resolve(__dirname, "src/popup.ts")],
    outfile: resolve(distDir, "popup.js"),
    format: "esm",
  },
  {
    entryPoints: [resolve(__dirname, "src/panel.ts")],
    outfile: resolve(distDir, "panel.js"),
    format: "esm",
  },
];

// --- Copy static assets to dist ---
function copyStatic() {
  // manifest.json
  cpSync(resolve(__dirname, "manifest.json"), resolve(distDir, "manifest.json"));
  // HTML files
  cpSync(resolve(__dirname, "popup.html"), resolve(distDir, "popup.html"));
  cpSync(resolve(__dirname, "panel.html"), resolve(distDir, "panel.html"));
  // CSS
  mkdirSync(resolve(distDir, "styles"), { recursive: true });
  cpSync(
    resolve(__dirname, "src/styles/popup.css"),
    resolve(distDir, "styles/popup.css"),
  );
  cpSync(
    resolve(__dirname, "src/styles/panel.css"),
    resolve(distDir, "styles/panel.css"),
  );
  // Icons (if they exist)
  try {
    cpSync(resolve(__dirname, "public/icons"), resolve(distDir, "icons"), {
      recursive: true,
    });
  } catch {
    // Icons may not exist yet — that's OK
    mkdirSync(resolve(distDir, "icons"), { recursive: true });
  }
  console.log("✓ Static assets copied to dist/");
}

copyStatic();

// --- Run builds ---
async function build() {
  if (isWatch) {
    // Watch mode — create contexts
    const contexts = await Promise.all(
      entries.map((entry) =>
        esbuild.context({ ...commonOptions, ...entry }),
      ),
    );
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    console.log("👀 Watching for changes...");
  } else {
    // One-shot build
    await Promise.all(
      entries.map((entry) => esbuild.build({ ...commonOptions, ...entry })),
    );
    console.log("✅ Build complete → dist/");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
