import { expect } from "@playwright/test";

async function openSelect(page, label) {
  // By role: the open menu's listbox carries the same label.
  const field = page.getByRole("combobox", { name: label, exact: true }).filter({ visible: true });
  // Vuetify 4 select inputs ignore pointer events, so the click is forced; retry while an overlay (e.g. the spinner) still takes it.
  await expect(async () => {
    await field.click({ force: true });
    await expect(field).toHaveAttribute("aria-expanded", "true", { timeout: 1_000 });
  }).toPass();
}

export async function pickOption(page, label, option) {
  await openSelect(page, label);
  await page.getByRole("option", { name: option }).first().click();
}

export async function pickFirstOption(page, label) {
  await openSelect(page, label);
  await page.getByRole("option").first().click();
}

export async function searchAndPick(page, label, text) {
  const field = page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field.click();
  await field.fill(text);
  await page.getByRole("option", { name: new RegExp(text, "i") }).first().click();
}
