import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "../e2e/fixtures.mjs";
import { appRoutes } from "../e2e/support/app-routes.mjs";
import { waitForPageToSettle } from "../e2e/support/page.mjs";
import { routeUrl } from "../e2e/support/route-url.mjs";

const OUT = process.env.VISUAL_OUT;

for (const route of appRoutes()) {
  test(`capture ${route.name}`, async ({ page }) => {
    if (!OUT) throw new Error("Set VISUAL_OUT to the screenshot folder");
    mkdirSync(OUT, { recursive: true });
    await page.goto(routeUrl(route));
    await waitForPageToSettle(page).catch(() => {});
    await page.screenshot({ path: join(OUT, `${route.name}.png`), fullPage: true });
  });
}
