/// <reference types="vitest/config" />
import { readdirSync } from "node:fs";
import { join } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

// Every .html file in the repo is a page and a build entry, so a multi-page
// hand-written site needs no build config: add pages, link them, ship.
// (Vite's default would build only the root index.html and silently drop the
// rest from dist/ — fine locally, 404s deployed.)
const SKIP = new Set(["node_modules", "dist", "spec", "scripts", "reflections", "e2e"]);

function htmlEntries(dir = "."): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".") || SKIP.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlEntries(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

// `base: "./"` makes built asset URLs relative, so the site works under any
// GitHub Pages path (username.github.io/your-repo/) without further config.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: htmlEntries(),
    },
  },
  test: {
    // Individual test files opt into jsdom via a `// @vitest-environment
    // jsdom` pragma; this setup file is a no-op under the default node
    // environment (it guards on `typeof window`), so it's safe to load
    // globally rather than per-file.
    setupFiles: ["vitest-canvas-mock", "@testing-library/jest-dom/vitest"],
    // e2e/*.spec.ts are Playwright tests (run via `pnpm test:e2e`), not
    // Vitest's — Vitest's default include glob matches *.spec.ts too, so
    // without this exclude it tries and fails to run them as unit tests.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
