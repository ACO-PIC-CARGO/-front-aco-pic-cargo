import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      include: ["src/**/__tests__/*.spec.ts"],
      exclude: [...configDefaults.exclude, "tests/**"],
      // Windows: VS Code abre la carpeta como "c:\..." y Vitest carga sus módulos como "C:\...";
      // con la letra de unidad distinta hay dos copias (falla "failed to find the runner" y los vi.mock)
      root: fileURLToPath(new URL("./", import.meta.url)).replace(/^[a-z]:/, (unidad) => unidad.toUpperCase()),
      server: { deps: { inline: ["vuetify", "sweetalert2", "vue-router"] } },
      setupFiles: ["./src/test/setup.ts"],
    },
  }),
);
