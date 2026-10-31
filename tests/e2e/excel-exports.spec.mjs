import { readFile } from "node:fs/promises";
import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const ZIP_SIGNATURE = "PK";

test("Exportar downloads the session branch's predefined comments as a real workbook", async ({ page }) => {
  await page.goto("/home/comentarios_predefinidos/listado");
  await waitForPageToSettle(page);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar" }).click();
  const file = await download;

  expect(file.suggestedFilename()).toMatch(/\.xlsx$/);
  expect((await readFile(await file.path())).subarray(0, 2).toString()).toBe(ZIP_SIGNATURE);
});
