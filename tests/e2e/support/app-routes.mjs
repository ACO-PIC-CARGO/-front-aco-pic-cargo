import { readFileSync } from "node:fs";

const ROUTER_FILE = new URL("../../../src/router/index.js", import.meta.url);
const ROUTE = /path:\s*(["'`])(.*?)\1\s*,[^{}]*?name:\s*(["'`])(.*?)\3/g;

export function parseRoutes(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const block = code.slice(code.indexOf("const routes = ["), code.indexOf("const router ="));
  const routes = [...block.matchAll(ROUTE)].map(([, , path, , name]) => ({
    name,
    path: path.startsWith("/") ? path : `/home/${path}`.replace(/\/$/, ""),
  }));
  const names = block.match(/\bname:\s*["'`]/g) ?? [];
  if (routes.length !== names.length) {
    throw new Error(
      `Parsed ${routes.length} routes but found ${names.length} names in src/router/index.js; update ROUTE in tests/e2e/support/app-routes.mjs`
    );
  }
  return routes;
}

export const appRoutes = () => parseRoutes(readFileSync(ROUTER_FILE, "utf8"));
