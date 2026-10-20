import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

export default defineConfig({
  plugins: [
    // Vue 3 dropped the obsolete <center> tag from its HTML list; templates still use it 83 times.
    vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === "center" } } }),
    vuetify({ autoImport: true }),
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
        // Raises the Workbox precache file size limit from its 2 MiB default to 3 MiB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    extensions: [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"],
  },
  server: {
    port: 8080,
    strictPort: true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(","),
  },
  preview: { port: 8080 },
  optimizeDeps: {
    include: ["vuetify/components/**", "vuetify/directives/**"],
  },
});
