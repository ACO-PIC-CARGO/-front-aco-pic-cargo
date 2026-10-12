export async function pickOption(page, label, option) {
  await page.getByLabel(label, { exact: true }).filter({ visible: true }).click();
  await page.getByRole("option", { name: option }).first().click();
}

export async function pickFirstOption(page, label) {
  await page.getByLabel(label, { exact: true }).filter({ visible: true }).click();
  await page.getByRole("option").first().click();
}

export async function searchAndPick(page, label, text) {
  const field = page.getByLabel(label, { exact: true }).filter({ visible: true });
  await field.click();
  await field.fill(text);
  await page.getByRole("option", { name: new RegExp(text, "i") }).first().click();
}
