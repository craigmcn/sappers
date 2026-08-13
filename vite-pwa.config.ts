import { VitePWA, type VitePWAOptions } from "vite-plugin-pwa";

// Shared between vite.config.ts (dist/) and vite.config.netlify.ts (netlify/,
// netlify/sappers/) so both build outputs get the same manifest/service
// worker behavior. `base: './'` in both configs keeps every generated URL
// relative, which is what makes the same manifest work whether the app is
// served from a domain root (Netlify) or the /sappers/ subdirectory
// (craigmcn.com/sappers).
export function pwaPlugin(): ReturnType<typeof VitePWA> {
  const options: Partial<VitePWAOptions> = {
    registerType: "prompt",
    manifest: {
      name: "Sappers",
      short_name: "Sappers",
      description: "A browser-based Minesweeper game.",
      theme_color: "#D9531E",
      background_color: "#1B1D16",
      display: "standalone",
      start_url: ".",
      scope: ".",
      icons: [
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "icons/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}"],
    },
  };

  return VitePWA(options);
}
