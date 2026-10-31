import { test, expect } from "./fixtures.mjs";
import { waitForPageToSettle } from "./support/page.mjs";

const LIST = "/home/folderMaster/list";
const FOREIGN_MASTER_ID = 2710;
const OUTSIDE_DRIVE = "https://evil.example/personal/desarrollo_piccargope_onmicrosoft_com/Documents/x";
const ETA_BEFORE_ETD = "La fecha de llegada (ETA) no puede ser anterior a la de salida (ETD)";

const dialogWith = (page, text) => page.locator(".swal2-popup").filter({ hasText: text });
const mastersOnList = (page) =>
  page.evaluate(() => {
    const pinia = document.querySelector("#app").__vue_app__.config.globalProperties.$pinia;
    return JSON.parse(JSON.stringify(pinia.state.value.app.itemsMasterList));
  });

async function openList(page) {
  const list = page.waitForResponse((r) => r.url().includes("/getMasterList"), { timeout: 45_000 });
  await page.goto(LIST);
  await list;
  await waitForPageToSettle(page);
  const masters = await mastersOnList(page);
  const active = masters.filter((m) => m.status === 1);
  return {
    open: active.find((m) => !m.statuslock && !m.statuslockadm),
    closed: active.find((m) => m.statuslock || m.statuslockadm),
    withHouses: active.find((m) => Number(m.cantidad_houses) > 0),
  };
}

async function showOnly(page, code) {
  await page.getByLabel("Buscar").fill(code);
  const row = page.locator("tbody tr").filter({ hasText: code }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

test.describe("M1 master file", () => {
  test("another company's master does not open", async ({ page }) => {
    const view = page.waitForResponse((r) => r.url().includes(`/getMasterId/${FOREIGN_MASTER_ID}`));
    await page.goto(`/home/folderMaster/control/ver/${FOREIGN_MASTER_ID}`);

    expect((await (await view).json()).estadoflag).toBe(false);
    await expect(dialogWith(page, "No encontramos ese expediente en tu empresa")).toBeVisible();
  });

  test("a new master gets its number when saved, not when the form opens", async ({ page }) => {
    const asked = [];
    page.on("request", (r) => r.url().includes("/getNroMaster") && asked.push(r.url()));
    await page.goto("/home/folderMaster/control");
    await waitForPageToSettle(page);

    await expect(page.getByLabel("N° de Expedientes")).toHaveAttribute("placeholder", "Se asigna al guardar");
    expect(asked).toEqual([]);
  });

  test("a master whose house fails is not created twice: the user lands on the created master", async ({ page }) => {
    const { open } = await openList(page);
    test.skip(!open, "no open master on this database");
    await page.route(/\/setMaster$/, (route) =>
      route.fulfill({ json: { estadoflag: true, mensaje: "Registro correcto", tipomensaje: "TMSGINF", data: [{ id: open.id, code_master: open.code_master }] } }),
    );
    await page.route(/\/setHouse$/, (route) => route.abort());
    await page.goto("/home/folderMaster/control");
    await waitForPageToSettle(page);
    await page.evaluate(() => {
      const pinia = document.querySelector("#app").__vue_app__.config.globalProperties.$pinia;
      Object.assign(pinia.state.value.masters, { master_sentido: 1, master_incoterms: 1, master_fecha_etd: "2026-03-01", master_fecha_eta: "2026-03-15" });
      Object.assign(pinia.state.value.app, { master_id_trasnport: { id: 2 }, master_origen: 1, master_destino: 2 });
    });

    await page.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();

    await expect(dialogWith(page, `Creamos el expediente ${open.code_master}, pero no pudimos crear su house`)).toBeVisible();
    await page.locator(".swal2-confirm").click();
    await expect(page).toHaveURL(new RegExp(`/folderMaster/control/editar/${open.id}$`));
  });

  test("an ETA before the ETD is stopped in the master form before saving", async ({ page }) => {
    const { open } = await openList(page);
    test.skip(!open, "no open master on this database");
    const edits = [];
    page.on("request", (r) => r.url().includes("/editMaster/") && edits.push(r.url()));
    await page.goto(`/home/folderMaster/control/editar/${open.id}`);
    await waitForPageToSettle(page);

    await page.getByLabel("Salida (ETD)").fill("2026-03-15");
    await page.getByLabel("Llegada (ETA)").fill("2026-03-01");
    await page.getByLabel("Llegada (ETA)").blur();
    await expect(dialogWith(page, ETA_BEFORE_ETD)).toBeVisible();
    await page.locator(".swal2-confirm").click();

    await page.getByRole("button", { name: "Acciones" }).click();
    await page.getByRole("button", { name: "Guardar Cambios" }).click();

    await expect(dialogWith(page, "La fecha ETA no puede ser anterior a la ETD")).toBeVisible();
    expect(edits).toEqual([]);
  });

  test("a closed master offers no date editing while an open one does", async ({ page }) => {
    const { open, closed } = await openList(page);
    test.skip(!open || !closed, "needs an open and a closed master on this database");

    const closedRow = await showOnly(page, closed.code_master);
    await expect(closedRow.locator(".mdi-calendar-edit")).toHaveCount(0);
    await expect(closedRow).toHaveClass(/rowRed/);

    const openRow = await showOnly(page, open.code_master);
    await expect(openRow.locator(".mdi-calendar-edit")).toHaveCount(1);
  });

  test("a folder outside the company OneDrive is refused with the reason", async ({ page }) => {
    const { open } = await openList(page);
    test.skip(!open, "no open master on this database");
    const row = await showOnly(page, open.code_master);

    await row.locator(".mdi-folder").click();
    await page.getByLabel("Nueva URL").fill(OUTSIDE_DRIVE);
    const saved = page.waitForResponse((r) => r.url().includes("/actualizar_folder_onedrive_master"));
    await page.getByRole("button", { name: "Guardar" }).last().click();

    expect((await (await saved).json()).estadoflag).toBe(false);
    await expect(page.getByText("Esa carpeta no es de OneDrive de tu empresa")).toBeVisible();
  });

  test("viewing a master offers no house delete or move", async ({ page }) => {
    const { withHouses } = await openList(page);
    test.skip(!withHouses, "no master with houses on this database");
    const houses = page.waitForResponse((r) => r.url().includes("/getHouseList"), { timeout: 45_000 });
    await page.goto(`/home/folderMaster/control/ver/${withHouses.id}`);
    await houses;
    await waitForPageToSettle(page);

    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".mdi-delete")).toHaveCount(0);
    await expect(page.locator(".mdi-folder-arrow-up-down")).toHaveCount(0);
  });
});
