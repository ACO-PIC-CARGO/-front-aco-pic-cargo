import { readFileSync } from "node:fs";

const PARAMS_FILE = new URL("../fixtures/route-params.json", import.meta.url);

export function buildRouteUrl({ name, path }, paramsByRoute) {
  const values = paramsByRoute[name] ?? {};
  const url = path.replace(/:(\w+)(\?)?/g, (_, key, optional) => {
    if (values[key] !== undefined) return encodeURIComponent(values[key]);
    if (optional) return "";
    throw new Error(`Add "${key}" for route "${name}" to tests/e2e/fixtures/route-params.json`);
  });
  return url.replace(/\/+$/, "") || "/";
}

export const routeUrl = (route) =>
  buildRouteUrl(route, JSON.parse(readFileSync(PARAMS_FILE, "utf8")));
