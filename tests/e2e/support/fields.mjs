import { expect } from "@playwright/test";

// A closed Vuetify 4 drawer stays in the DOM as `inert`: users can't reach it, but Playwright still counts it as visible.
export const outsideInert = (page, locator) => locator.and(page.locator(":not([inert], [inert] *)"));

// By role: Vuetify 4 labels the open menu's listbox with the field's label too.
const comboboxField = (page, label) =>
  outsideInert(page, page.getByRole("combobox", { name: label, exact: true }).filter({ visible: true }));

const option = (page, name) => outsideInert(page, page.getByRole("option", name === undefined ? {} : { name })).first();

async function openSelect(page, label) {
  const field = comboboxField(page, label);
  // Vuetify 4 select inputs ignore pointer events, so the click is forced; retry while an overlay (e.g. the spinner) still takes it.
  // Click only while closed: the select toggles on mousedown, so a retry after a slow open would close it.
  await expect(async () => {
    if ((await field.getAttribute("aria-expanded")) !== "true") await field.click({ force: true });
    await expect(field).toHaveAttribute("aria-expanded", "true", { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}

export async function pickOption(page, label, name) {
  await openSelect(page, label);
  await option(page, name).click();
}

export async function pickFirstOption(page, label) {
  await openSelect(page, label);
  await option(page).click();
}

export async function searchAndPick(page, label, text) {
  const field = comboboxField(page, label);
  await field.click();
  await field.fill(text);
  await option(page, new RegExp(text, "i")).click();
}
