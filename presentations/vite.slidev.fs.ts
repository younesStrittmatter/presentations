import { defineConfig } from "vite";

/**
 * Shared dev-server fs settings for all decks under presentations/.
 *
 * Decks live in subfolders (e.g. presentations/psyche/) while node_modules sits at
 * repo root. Vite’s default fs.allow + strict checks can still reject /@fs/ paths on
 * some setups (symlinks on GPFS, path normalization). Then dynamic imports like
 * play.vue return the SPA HTML shell → browser: MIME type "text/html" for a module.
 */
export default defineConfig({
  server: {
    fs: {
      strict: false,
    },
  },
});
