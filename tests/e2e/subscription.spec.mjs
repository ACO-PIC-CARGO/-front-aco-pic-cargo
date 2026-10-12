import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

test("shows the public plans page", async ({ page }) => {
  await page.goto("/planes");
  await expect(page.getByRole("heading", { name: "Precios ACO" })).toBeVisible();
});

test("opens the Paddle checkout when buying a plan from Mi plan", async ({ page }) => {
  const checkout = page.locator('iframe[src*="paddle.com"]');
  await page.goto("/home/mi-plan");
  await waitForPageToSettle(page);
  await expect(checkout).toHaveCount(0);
  await page.getByRole("button", { name: /^Comprar: ACO / }).first().click();
  const modules = page.getByRole("dialog").filter({ hasText: "Elige tus módulos" });
  const needsModules = await modules.waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false);
  if (needsModules) {
    const proceed = modules.getByRole("button", { name: "Continuar al pago" });
    for (const box of await modules.getByRole("checkbox").all()) {
      if (await proceed.isEnabled()) break;
      await box.focus();
      await page.keyboard.press("Space");
    }
    await expect(proceed).toBeEnabled();
    await proceed.click();
  }
  await expect(checkout).toBeAttached({ timeout: 30_000 });
});
