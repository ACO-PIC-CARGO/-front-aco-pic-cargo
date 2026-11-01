import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { pickOption } from "./support/fields.mjs";
import { appRoutes } from "./support/app-routes.mjs";
import { credentials, SESSION_FILE } from "./support/env.mjs";
import { submitLogin } from "./support/login.mjs";
import { acknowledge, waitForPageToSettle } from "./support/page.mjs";
import { reportAppVersionAsServerVersion } from "./support/server-version.mjs";
import { fillNewUserData } from "./support/users.mjs";

const API = process.env.E2E_API_URL ?? "http://localhost:9200/";
const PASSWORD = "Clave-E2e-2026";
const NO_SCREEN_ACCESS = "No tienes acceso a esta pantalla. Pide a un administrador de tu empresa que te lo asigne.";
const ROLE_SCREENS = ["lstPosition", "lstPermissions", "listUser", "Main"];
const ANY_MESSAGE = /\S/;

function apiSession() {
  const { session } = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  return { "auth-token": session["auth-token"], "x-branch-id": String(JSON.parse(session.dataUser)[0].id_branch) };
}

async function api(request, method, path, data) {
  const body = await (await request.fetch(API + path, { method, headers: apiSession(), data })).json();
  return body.data;
}

// Two screens the admin can grant that open without route params, so the new user can visit them by URL.
async function twoGrantableScreens(request) {
  const paths = new Map(appRoutes().map((route) => [route.name, route.path]));
  const catalog = await api(request, "GET", "permissions/catalog?role_id=");
  return catalog
    .filter((screen) => paths.has(screen.route) && !paths.get(screen.route).includes(":"))
    .filter((screen) => !ROLE_SCREENS.includes(screen.route))
    .filter((screen) => screen.actions.some((action) => action.name === "VER" && action.grantable))
    .slice(0, 2)
    .map((screen) => ({ ...screen, path: paths.get(screen.route) }));
}

async function loginAs(browser, baseURL, user) {
  const context = await browser.newContext({ baseURL });
  await reportAppVersionAsServerVersion(context);
  const page = await context.newPage();
  await submitLogin(page, { user, password: PASSWORD });
  const branchPicker = page.getByRole("button", { name: "Continuar" });
  await expect(async () => {
    expect(page.url().endsWith("/home/main") || (await branchPicker.isVisible())).toBe(true);
  }).toPass({ timeout: 30_000 });
  // A user with one branch is taken to Main on its own right after the picker shows.
  const landedAlone = await page.waitForURL(/\/home\/main$/, { timeout: 5_000 }).then(() => true, () => false);
  if (!landedAlone) {
    await branchPicker.click({ trial: true });
    await page.getByLabel("Sucursal", { exact: true }).click({ force: true });
    await page.getByRole("option", { name: credentials().branch }).click();
    await branchPicker.click();
  }
  await expect(page).toHaveURL(/\/home\/main$/, { timeout: 30_000 });
  return { context, page };
}

const menuScreenRoutes = (page) =>
  page.evaluate(() => {
    const routes = [];
    const walk = (nodes) =>
      (nodes ?? []).forEach((node) => (node.children?.length ? walk(node.children) : node.route && routes.push(node.route)));
    walk(JSON.parse(sessionStorage.getItem("menu")));
    return routes;
  });

test("a role with two screens gives its user exactly those screens and refuses the rest by URL", async ({ page, request, browser }, testInfo) => {
  const screens = await twoGrantableScreens(request);
  expect(screens, "the permission catalog has two grantable screens without route params").toHaveLength(2);
  const roleName = `E2E M8 Rol ${Date.now()}`;
  const email = `e2e.m8.roles.${Date.now()}@example.com`;
  let roleId;
  let userId;

  try {
    await page.goto("/home/posicion/nuevo");
    await waitForPageToSettle(page);
    await page.getByLabel("Nombre (*)", { exact: true }).fill(roleName);
    for (const screen of screens) await page.getByRole("checkbox", { name: `Ver en ${screen.screen}`, exact: true }).check();
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await acknowledge(page, ANY_MESSAGE);
    await expect(page).toHaveURL(/\/home\/posicion\/listado$/);
    roleId = (await api(request, "GET", `roles?search=${encodeURIComponent(roleName)}&estado=`)).find((role) => role.name === roleName).id;

    await page.goto("/home/usuarios/nuevo");
    await waitForPageToSettle(page);
    await fillNewUserData(page, { email, password: PASSWORD });
    await page.getByRole("button", { name: "Siguiente" }).click();
    await pickOption(page, "Módulo", roleName);
    await page.getByRole("button", { name: "Agregar" }).click();
    await page.getByRole("button", { name: "Guardar" }).click();
    await acknowledge(page, /registro correcto/i);
    const userFilters = new URLSearchParams({ users: "", nombrecompleto: "", id_document: "", document: "", phone: "", email, status: "" });
    userId = (await api(request, "GET", `listar_usuarios?${userFilters}`))[0].id;

    await page.goto(`/home/posicion/ver/${roleId}`);
    await waitForPageToSettle(page);
    await expect(page.getByRole("row").filter({ hasText: email })).toHaveCount(1);

    const { context, page: userPage } = await loginAs(browser, testInfo.project.use.baseURL, email);
    try {
      expect((await menuScreenRoutes(userPage)).toSorted()).toEqual(screens.map((screen) => screen.route).toSorted());

      await userPage.goto(screens[0].path);
      await waitForPageToSettle(userPage);
      await expect(userPage).toHaveURL(new RegExp(`${screens[0].path}$`));

      await userPage.goto("/home/usuarios/listado");
      await expect(userPage.getByRole("dialog").filter({ hasText: NO_SCREEN_ACCESS })).toBeVisible();
      await expect(userPage).toHaveURL(/\/home\/main$/);
    } finally {
      await context.close();
    }
  } finally {
    if (userId) await api(request, "PUT", "cambiar_estado_usuario", { id: userId, status: 0 });
    if (roleId) {
      await api(request, "PUT", `roles/${roleId}/users`, { users: [] });
      await api(request, "PUT", `roles/${roleId}`, { name: roleName, description: "", estado: false, permissions: [] });
    }
  }
});
