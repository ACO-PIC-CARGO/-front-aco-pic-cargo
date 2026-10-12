import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

test("shows the public plans page", async ({ page }) => {
  await page.goto("/planes");
  await expect(page.getByRole("heading", { name: "Precios ACO" })).toBeVisible();
});

test("opens the Paddle checkout when buying a plan from Mi plan", async ({ page }) => {
  await page.goto("/home/mi-plan");
  await waitForPageToSettle(page);
  await page.getByRole("button", { name: /^Comprar: ACO / }).first().click();
  const modules = page.getByRole("dialog").filter({ hasText: "Elige tus módulos" });
  if (await modules.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await modules.getByText("PRICING", { exact: true }).click();
    await modules.getByRole("button", { name: "Continuar al pago" }).click();
  }
  await expect(page.locator('iframe[src*="paddle.com"]')).toBeAttached({ timeout: 30_000 });
});
