import { test, expect } from "../fixtures.mjs";
import { appRoutes } from "../support/app-routes.mjs";
import { waitForPageToSettle } from "../support/page.mjs";
import { routeUrl } from "../support/route-url.mjs";

const EXPECTED_REDIRECTS = { Home: "/home/main" };

const SPINNER_NEVER_CLEARS = {
  controlHouse: "pre-existing on Vue 2: listar_montos_finales_quote runs about 30 s on the development data and then answers 500, so the spinner outlives the wait",
  cargaMasivaCalc: "pre-existing on Vue 2: cargar_moneda never answers on the development DB, so the page never hides the spinner",
  listFlujoMensual: "pre-existing on Vue 2: getDebsToPay and getReportAccounts do not answer within 110 s on the development data",
};

const ROUTES_THAT_MATCH_NOTHING = {
  UserCalculadoraVer: "pre-existing on Vue 2: src/router/index.js declares path and name twice in one record, so this URL is never registered",
};

for (const route of appRoutes()) {
  test(`smoke ${route.name}`, async ({ page }) => {
    const url = routeUrl(route);
    await page.goto(url);
    await waitForPageToSettle(page, { spinnerClears: !(route.name in SPINNER_NEVER_CLEARS) });
    expect(new URL(page.url()).pathname, "page redirected").toBe(EXPECTED_REDIRECTS[route.name] ?? url);
    if (route.name in ROUTES_THAT_MATCH_NOTHING) return;
    await expect(page.locator("#app")).not.toBeEmpty();
    await expect(page.locator("#app")).not.toContainText("[object Promise]");
  });
}
