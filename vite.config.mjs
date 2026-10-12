import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  envPrefix: ["VITE_", "VUE_APP_"],
  plugins: [
    vue(),
    vuetify({ autoImport: true, styles: { configFile: "src/styles/settings.scss" } }),
    VitePWA({
      injectRegister: false,
      filename: "service-worker.js",
      manifestFilename: "manifest.json",
      manifest: {
        name: "Sistema ChainSolver",
        short_name: "ChainSolver",
        theme_color: "#252C32",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [{ src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // The entry chunk exceeds Workbox's 2 MiB default because the router imports every view eagerly.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json", ".vue"],
  },
  server: {
    port: 8080,
    strictPort: true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(","),
  },
  preview: { port: 8080 },
  optimizeDeps: {
    include: [
      "vuetify/components/VOverlay",
      "vuetify/components/VDialog",
      "vuetify/components/VMenu",
      "vuetify/components/VSelect",
      "vuetify/components/VTooltip",
    ],
  },
});
