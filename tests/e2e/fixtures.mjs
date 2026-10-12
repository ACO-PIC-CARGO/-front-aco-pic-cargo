import { readFileSync } from "node:fs";
import { test as base, expect } from "@playwright/test";
import { isKnownNoise } from "./known-console-noise.mjs";
import { appRoutes, routeNameForPath } from "./support/app-routes.mjs";
import { SESSION_FILE } from "./support/env.mjs";
import { stubRequestsThatCrashTheBackend } from "./support/backend-crashes.mjs";
import { reportAppVersionAsServerVersion } from "./support/server-version.mjs";

const ROUTES = appRoutes();
const currentRouteName = (page) => routeNameForPath(ROUTES, new URL(page.url()).pathname);

const RUNTIME_PROBLEM = /^(Uncaught )?\w*Error\b|\[Vue warn\]|\[Vue Router warn\]/;

export const test = base.extend({
  authenticated: [true, { option: true }],
  page: async ({ page, authenticated }, use) => {
    if (authenticated) {
      const saved = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
      await page.addInitScript((storage) => {
        if (window.sessionStorage.getItem("e2e-session-restored")) return;
        for (const [key, value] of Object.entries(storage.local)) window.localStorage.setItem(key, value);
        for (const [key, value] of Object.entries(storage.session)) window.sessionStorage.setItem(key, value);
        window.sessionStorage.setItem("e2e-session-restored", "1");
      }, saved);
    }
    await reportAppVersionAsServerVersion(page);
    await stubRequestsThatCrashTheBackend(page);
    const problems = [];
    page.on("pageerror", (error) => {
      if (!isKnownNoise(error.message, currentRouteName(page))) problems.push(`[${page.url()}] pageerror: ${error.message}`);
    });
    page.on("console", (message) => {
      const text = message.text();
      if (RUNTIME_PROBLEM.test(text) && !isKnownNoise(text, currentRouteName(page))) {
        problems.push(`[${page.url()}] ${message.type()}: ${text}`);
      }
    });
    await use(page);
    expect(problems, "runtime errors and Vue warnings").toEqual([]);
  },
});

export { expect };
