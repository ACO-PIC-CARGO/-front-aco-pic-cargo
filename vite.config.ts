import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import vuetify from "vite-plugin-vuetify";

// Archivos que index.html carga al arrancar (entry, modulepreload y CSS) + el propio index.html.
const shellFiles = () => {
  const html = readFileSync(resolve("dist", "index.html"), "utf-8");
  const referenced = [...html.matchAll(/(?:src|href)="\/([^"]+\.(?:js|css))"/g)].map((match) => match[1]!);
  return new Set(["index.html", "manifest.json", ...referenced]);
};

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
        name: "Sistema Operativo ACO",
        short_name: "ACO",
        theme_color: "#252C32",
        background_color: "#ffffff",
        display: "standalone",
        // Sin start_url fijo: el acceso directo abre la dirección desde la que se instaló
        // (p. ej. /home/FolderBanks/ingresosPendientesConfirmar). Se anula el "/" por defecto del plugin.
        start_url: undefined,
        // id y scope fijos: la app es la misma aunque se instale desde otra pantalla y navega por todo el sitio.
        id: "/",
        scope: "/",
        icons: [{ src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }],
      },
      workbox: {
        // La versión nueva queda "instalada" en espera: el aviso de la app la activa con
        // postMessage({ type: "SKIP_WAITING" }) cuando el usuario pulsa "Actualizar ahora".
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Raises the Workbox precache file size limit from its 2 MiB default to 3 MiB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Una versión nueva solo descarga el "shell" (index.html y lo que carga al arrancar).
        // Workbox baja el precache archivo por archivo: con los ~600 chunks de la app el aviso tardaba
        // minutos; con el shell son segundos. El resto de pantallas se guarda al abrirlas (abajo).
        manifestTransforms: [
          (entries) => {
            const shell = shellFiles();
            return { manifest: entries.filter((entry) => shell.has(entry.url)), warnings: [] };
          },
        ],
        runtimeCaching: [
          {
            // Chunks con hash en el nombre: nunca cambian, se sirven de caché tras la primera visita.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "aco-assets",
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
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
