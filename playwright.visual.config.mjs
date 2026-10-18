import { defineConfig } from "@playwright/test";
import base from "./playwright.config.mjs";

export default defineConfig({
  ...base,
  testDir: "./tests/visual",
  webServer: undefined,
  workers: 2,
});
