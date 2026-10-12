import { test, expect } from "../fixtures.mjs";
import { appRoutes } from "../support/app-routes.mjs";
import { waitForPageToSettle } from "../support/page.mjs";
import { routeUrl } from "../support/route-url.mjs";

const EXPECTED_REDIRECTS = { Home: "/home/main" };

const SPINNER_NEVER_CLEARS = {
  nuevoProveedor: "pre-existing on Vue 2: the page awaits cargar_master_detalle_tipo_persona, which crashes the local backend, and never hides the spinner after the failure",
  verProveedor: "pre-existing on Vue 2: the page awaits cargar_master_detalle_tipo_persona and entitie/cargar_datos_tarifas, which crash or hang the local backend",
  editarProveedor: "pre-existing on Vue 2: the page awaits cargar_master_detalle_tipo_persona and entitie/cargar_datos_tarifas, which crash or hang the local backend",
  nuevoClientes: "pre-existing on Vue 2: the page awaits cargar_master_detalle_tipo_persona, which crashes the local backend, and never hides the spinner after the failure",
  verCliente: "pre-existing on Vue 2: the page awaits cargar_master_detalle_tipo_persona, which crashes the local backend, and never hides the spinner after the failure",
  editarCliente: "pre-existing on Vue 2: the page awaits cargar_master_detalle_tipo_persona, which crashes the local backend, and never hides the spinner after the failure",
  editControlGasto: "pre-existing on Vue 2: control_gastos_list and getMasterList hang on the local database, and no control gasto exists with id 1",
  verControlGasto: "pre-existing on Vue 2: control_gastos_list and getMasterList hang on the local database, and no control gasto exists with id 1",
  verQuote: "pre-existing on Vue 2: getQuoteId answers 500 because the local branch has no quotes",
  editQuote: "pre-existing on Vue 2: getQuoteId answers 500 because the local branch has no quotes",
  cargaMasivaCalc: "pre-existing on Vue 2: cargar_moneda hangs on the local database",
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
  });
}
