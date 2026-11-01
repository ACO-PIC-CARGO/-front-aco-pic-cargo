import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useControlGastosStore } from "@/stores/controlGastos";
import { RECOVERY_NEEDS_EMAIL, useSecuritysStore } from "@/stores/securitys";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface HttpConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
}

const URL_MAIN = String(import.meta.env.VITE_URL_MAIN);
const JSON_HEADERS = { "Content-Type": "application/json" };
const httpMock = http as unknown as Mock<(config: HttpConfig) => Promise<{ data: unknown }>>;

function respond(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length);
    if (!(path in bodies)) throw new Error(`unexpected request ${path}`);
    const body = bodies[path];
    if (body instanceof Error) throw body;
    return { data: body };
  });
}

const sessionOf = (key: string) => sessionStorage.getItem(key);
const localOf = (key: string) => localStorage.getItem(key);

const loginRow = { id: 7, id_entitie: 3, id_secutiry: 2, names: "Ana" };
const branch = { id: 5, trade_name: "PIC", iso_pais: "PE", esnuevoflag: false, porcentaje_config: "0", dias_restantes: 30 };
const menu = [{ id: 1, name: "Inicio", route: "Main" }];
const permissions = { screens: [{ route: "listUser", actions: ["VER"] }], controlled: ["listUser"] };
const config = { id: 9, nombre: "cfg" };

function setup() {
  return { securitys: useSecuritysStore(), controlGastos: useControlGastosStore() };
}

describe("securitys store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    useAppStore().lstMenu = [];
    useSecuritysStore().dataMenu = true;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("singin posts the login form, stores the session and loads the menu and settings before opening Main", async () => {
    const setItemsMenu = vi.spyOn(useAppStore(), "_setItemsMenu").mockImplementation(() => {});
    respond({
      singin: { estadoflag: true, mensaje: "", token: "tok", data: [{ ...loginRow }] },
      "CargarBranch/7": { data: [branch] },
      menu_session: { data: menu },
      my_permissions: { data: permissions },
      obtener_existe_datos_config: { estadoflag: true, data: [config] },
    });
    let menuWhenOpeningMain: unknown;
    vi.mocked(router.push).mockImplementation(async () => {
      menuWhenOpeningMain = structuredClone(toRaw(useAppStore().lstMenu));
    });
    const { securitys } = setup();
    securitys.frmLogin.user = "ana";
    securitys.frmLogin.password = "secreta";
    securitys.errorClave = "previo";

    const res = await securitys.singin();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "singin",
      headers: JSON_HEADERS,
      data: { user: "ana", password: "secreta", id_sucursal: "" },
    });
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: "get",
      url: URL_MAIN + "CargarBranch/7",
      headers: JSON_HEADERS,
    });
    expect(httpMock).toHaveBeenNthCalledWith(3, {
      method: "post",
      url: URL_MAIN + "menu_session",
      headers: JSON_HEADERS,
    });
    expect(httpMock).toHaveBeenNthCalledWith(4, {
      method: "get",
      url: URL_MAIN + "my_permissions",
      headers: JSON_HEADERS,
    });
    expect(httpMock).toHaveBeenNthCalledWith(5, {
      method: "get",
      url: URL_MAIN + "obtener_existe_datos_config",
      params: { id_branch: 5 },
      headers: JSON_HEADERS,
    });
    expect(res.estadoflag).toBe(true);
    expect(securitys.errorClave).toBe("");
    expect(securitys.lstSucursal).toEqual([branch]);
    const dataUser = JSON.stringify([{ ...loginRow, id_user: 7, id: 3, id_branch: 5 }]);
    for (const read of [sessionOf, localOf]) {
      expect(read("security")).toBe("2");
      expect(read("auth-token")).toBe("tok");
      expect(read("dataUser")).toBe(dataUser);
      expect(read("dataBranch")).toBe(JSON.stringify([branch]));
      expect(read("iso_pais")).toBe("PE");
      expect(read("permissions")).toBe(JSON.stringify(permissions));
    }
    expect(vi.mocked(router.push).mock.calls[0]![0]).toEqual({ name: "Main" });
    expect(menuWhenOpeningMain).toEqual(menu);
    expect(setItemsMenu).toHaveBeenCalledWith(menu);
    expect(useSecuritysStore().dataMenu).toBe(false);
    expect(sessionOf("menu")).toBe(JSON.stringify(menu));
    expect(localOf("ConfigEmpresa")).toBe(JSON.stringify(config));
  });

  test("_getMenuItem drops the permissions of the previous branch when the new ones can't be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_user: 7, id_branch: 5 }]));
    sessionStorage.setItem("permissions", JSON.stringify(permissions));
    localStorage.setItem("permissions", JSON.stringify(permissions));
    respond({ menu_session: { data: menu }, my_permissions: new Error("down") });

    await setup().securitys._getMenuItem();

    expect(sessionOf("permissions")).toBeNull();
    expect(localOf("permissions")).toBeNull();
    expect(sessionOf("menu")).toBe(JSON.stringify(menu));
  });

  test("singin sends a new company with one branch to the initial configuration", async () => {
    respond({
      singin: { estadoflag: true, mensaje: "", token: "tok", data: [{ ...loginRow }] },
      "CargarBranch/7": { data: [{ ...branch, esnuevoflag: true }] },
      menu_session: { data: menu },
      my_permissions: { data: permissions },
      obtener_existe_datos_config: { estadoflag: true, data: [config] },
    });
    const { securitys } = setup();

    await securitys.singin();

    expect(vi.mocked(router.push).mock.calls[0]![0]).toEqual({ name: "ConfiguracionInicial" });
  });

  test("singin shows the branch picker when the user has several branches", async () => {
    respond({
      singin: { estadoflag: true, mensaje: "", token: "tok", data: [{ ...loginRow }] },
      "CargarBranch/7": { data: [branch, { ...branch, id: 6 }] },
    });
    const { securitys } = setup();

    const res = await securitys.singin();

    expect(res.estadoflag).toBe(true);
    expect(securitys.MostrarLogin).toBe(false);
    expect(securitys.MostrarSucursal).toBe(true);
    expect(sessionOf("dataBranch")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
  });

  test("singin keeps the backend message when the credentials are rejected", async () => {
    respond({ singin: { estadoflag: false, mensaje: "Clave incorrecta", data: [] } });
    const { securitys } = setup();

    const res = await securitys.singin();

    expect(res.estadoflag).toBe(false);
    expect(securitys.response).toEqual({ estadoflag: false });
    expect(securitys.errorClave).toBe("Clave incorrecta");
    expect(sessionOf("auth-token")).toBeNull();
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("singin explains a failed request instead of leaving the login waiting", async () => {
    respond({ singin: new Error("Network Error") });
    const { securitys } = setup();

    const res = await securitys.singin();

    expect(res.estadoflag).toBe(false);
    expect(securitys.errorClave).toBe(CONNECTION_ERROR_MESSAGE);
    expect(sessionOf("auth-token")).toBeNull();
  });

  test("singin shows the server's answer when it refuses more attempts", async () => {
    const tooManyAttempts = "Hiciste demasiados intentos. Espera 15 minutos e inténtalo de nuevo.";
    respond({ singin: Object.assign(new Error("429"), { response: { status: 429, data: { mensaje: tooManyAttempts } } }) });
    const { securitys } = setup();

    await securitys.singin();

    expect(securitys.errorClave).toBe(tooManyAttempts);
  });

  test("CargarBranch keeps the branches when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_user: 7 }]));
    respond({ "CargarBranch/7": new Error("down") });
    const { securitys } = setup();
    securitys.lstSucursal.push(branch);

    await securitys.CargarBranch();

    expect(securitys.lstSucursal).toEqual([branch]);
    expect(console.error).toHaveBeenCalled();
  });

  test("ReEstablecerContrasenia sends the typed user and shows the backend answer", async () => {
    respond({ recuperar_clave: { estadoflag: true, mensaje: "Revisa tu correo" } });
    const { securitys } = setup();
    securitys.frmLogin.user = "ana@aco.pe";

    await securitys.ReEstablecerContrasenia();

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "recuperar_clave",
      headers: JSON_HEADERS,
      data: { email: "ana@aco.pe" },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", html: "Revisa tu correo" });
  });

  test("ReEstablecerContrasenia shows an error icon when the backend rejects", async () => {
    respond({ recuperar_clave: { estadoflag: false, mensaje: "Correo no registrado" } });
    const { securitys } = setup();
    securitys.frmLogin.user = "ana@aco.pe";

    await securitys.ReEstablecerContrasenia();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", html: "Correo no registrado" });
  });

  test("ReEstablecerContrasenia asks for the e-mail before sending anything", async () => {
    const { securitys } = setup();
    securitys.frmLogin.user = "  ";

    await securitys.ReEstablecerContrasenia();

    expect(httpMock).not.toHaveBeenCalled();
    expect(securitys.errorClave).toBe(RECOVERY_NEEDS_EMAIL);
  });

  test("ReEstablecerContrasenia tells the user when the request fails", async () => {
    respond({ recuperar_clave: new Error("Network Error") });
    const { securitys } = setup();
    securitys.frmLogin.user = "ana@aco.pe";

    await securitys.ReEstablecerContrasenia();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", html: CONNECTION_ERROR_MESSAGE });
  });

  test("ValidarToken returns the backend answer", async () => {
    const body = { estadoflag: true, mensaje: "ok" };
    respond({ validToken: body });
    const { securitys } = setup();

    expect(await securitys.ValidarToken()).toEqual(body);
    expect(httpMock).toHaveBeenCalledWith({ method: "post", url: URL_MAIN + "validToken", headers: JSON_HEADERS });
  });

  test("validarUsuarioAdmin returns the backend answer, or null when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const body = { estadoflag: true, mensaje: "" };
    respond({ validar_usuario_admin: body });
    const { securitys } = setup();

    expect(await securitys.validarUsuarioAdmin({ clave: "x" })).toEqual(body);
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "validar_usuario_admin",
      headers: JSON_HEADERS,
      data: { clave: "x" },
    });

    respond({ validar_usuario_admin: new Error("down") });
    expect(await securitys.validarUsuarioAdmin({ clave: "x" })).toBeNull();
  });

  test("singin writes into and returns the response a controlGastos bulk load stored", async () => {
    const cargaMasiva = { estadoflag: true, filas: 3 };
    respond({
      singin: { estadoflag: false, mensaje: "Clave incorrecta", data: [] },
      carga_masiva_controldegasto: { estadoflag: true, token: "t", data: cargaMasiva },
    });
    const { securitys, controlGastos } = setup();
    await controlGastos.CargaMasivaControlDeGastos({});

    const res = await securitys.singin();

    expect(toRaw(res)).toBe(cargaMasiva);
    expect(cargaMasiva).toEqual({ estadoflag: false, filas: 3 });
    expect(toRaw(controlGastos.response)).toBe(cargaMasiva);
  });
});
