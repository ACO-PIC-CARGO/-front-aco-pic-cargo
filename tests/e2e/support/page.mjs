import { expect } from "@playwright/test";

const LOADING_TEXT = "Cargando Datos, espere un momento por favor...";

export async function waitForPageToSettle(page, { spinnerClears = true } = {}) {
  await page.waitForLoadState("load");
  if (spinnerClears) await expect(page.getByText(LOADING_TEXT).first()).toBeHidden({ timeout: 30_000 });
  // ponytail: fixed settle for created()-hook requests; replace with per-page response waits if the suite gets slow
  await page.waitForTimeout(1_500);
}
