import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pwaPlugin } from "./vite-pwa.config.ts";

// Dual output: netlify/ (this repo's own Netlify site, served at the domain
// root) and netlify/sappers/ (copied to craigmcn.com/sappers). base: './'
// keeps every generated URL relative, so the same build works unmodified
// from either location.
export default defineConfig({
  base: "./",
  plugins: [react(), pwaPlugin()],
  build: {
    outDir: "netlify",
    rollupOptions: {
      output: [{ dir: "netlify" }, { dir: "netlify/sappers" }],
    },
  },
});
