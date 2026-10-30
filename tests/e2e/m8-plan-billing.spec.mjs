import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { SESSION_FILE } from "./support/env.mjs";
import { waitForPageToSettle } from "./support/page.mjs";
import { lockModuleInAccess, moduleIdForRoute } from "./support/plan-access.mjs";

const livePlan = {
  package_id: 3,
  package_name: "PRO",
  package_monthly_price: "79.00",
  billing: "monthly",
  modules: [],
  status: "active",
  current_period_ends_at: "2026-11-05T20:00:00Z",
  next_billed_at: "2026-11-05T20:00:00Z",
  scheduled_change_action: null,
  scheduled_change_at: null,
  canceled_at: null,
  user_limit: 3,
  user_count: 1,
  features: [],
};

const billingEntry = (over) => ({
  billed_at: "2026-10-05T12:00:00Z",
  origin: "subscription_recurring",
  product_name: "ACO PRO",
  billing: "monthly",
  status: "completed",
  has_invoice: false,
  ...over,
});

async function answerWith(page, pattern, rows) {
  await page.route(pattern, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, estadoflag: true, mensaje: null, tipomensaje: "TMSGINF", data: rows } });
  });
}

test("sends a locked module's detail screen to Mi plan like its list", async ({ page }) => {
  const { session } = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  const moduleId = moduleIdForRoute(JSON.parse(session.menu), "lstQuote");
  await page.route(/\/branch_subscription\/access(\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, json: lockModuleInAccess(await response.json(), moduleId) });
  });

  await page.goto("/home/folderPricing/verQuote/1");

  await expect(page).toHaveURL(/\/home\/mi-plan$/);
  await expect(page.getByText(/no está (en tu plan|disponible)/)).toBeVisible();
  await page.getByRole("button", { name: "Ahora no" }).click();
});

test("shows the next renewal of Mi plan in the company's time zone", async ({ page }) => {
  await answerWith(page, /\/branch_time_zone(\?|$)/, [{ time_zone: "Asia/Tokyo" }]);
  await answerWith(page, /\/branch_subscription(\?|$)/, [livePlan]);

  await page.goto("/home/mi-plan");
  await waitForPageToSettle(page);

  await expect(page.getByText("Próxima renovación: 6 de noviembre de 2026.")).toBeVisible();
});

test("shows each payment of the billing history in its own currency", async ({ page }) => {
  await answerWith(page, /\/branch_subscription\/billing_history(\?|$)/, [
    {
      transactions: [
        billingEntry({ id: "txn_usd", currency_code: "USD", total: "7900", adjusted_total: "7900" }),
        billingEntry({ id: "txn_jpy", currency_code: "JPY", total: "1500", adjusted_total: "1500" }),
      ],
      payment_method: null,
      can_update_payment_method: false,
    },
  ]);

  await page.goto("/home/historial-facturacion");
  await waitForPageToSettle(page);

  const yen = await page.evaluate(() => new Intl.NumberFormat("es", { style: "currency", currency: "JPY" }).format(1500));
  await expect(page.getByRole("row").filter({ hasText: "US$79" })).toHaveCount(1);
  await expect(page.getByRole("row").filter({ hasText: yen })).toHaveCount(1);
});
