import { expect } from "@playwright/test";

// By role: Vuetify 4 labels the open menu's listbox with the field's label too.
const comboboxField = (page, label) => page.getByRole("combobox", { name: label, exact: true }).filter({ visible: true });

async function openSelect(page, label) {
  const field = comboboxField(page, label);
  // Vuetify 4 select inputs ignore pointer events, so the click is forced; retry while an overlay (e.g. the spinner) still takes it.
  // Click only while closed: the select toggles on mousedown, so a retry after a slow open would close it.
  await expect(async () => {
    if ((await field.getAttribute("aria-expanded")) !== "true") await field.click({ force: true });
    await expect(field).toHaveAttribute("aria-expanded", "true", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
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
  const field = comboboxField(page, label);
  await field.click();
  await field.fill(text);
  await page.getByRole("option", { name: new RegExp(text, "i") }).first().click();
}
