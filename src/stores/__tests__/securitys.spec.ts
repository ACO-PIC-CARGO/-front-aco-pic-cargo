import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import store from "@/store";
import { useControlGastosStore } from "@/stores/controlGastos";
import { useSecuritysStore } from "@/stores/securitys";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn() } }));

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
    store.state = { lstMenu: [], dataMenu: true };
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("singin posts the login form and stores the session of a user with one branch", async () => {
    vi.useFakeTimers();
    respond({
      singin: { estadoflag: true, mensaje: "", token: "tok", data: [{ ...loginRow }] },
      "CargarBranch/7": { data: [branch] },
      getMenuModules: { data: menu },
      obtener_existe_datos_config: { estadoflag: true, data: [config] },
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
    }
    expect(vi.mocked(router.push).mock.calls[0]![0]).toEqual({ name: "Main" });
    expect(httpMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);

    expect(httpMock).toHaveBeenNthCalledWith(3, {
      method: "post",
      url: URL_MAIN + "getMenuModules",
      headers: JSON_HEADERS,
      data: JSON.stringify({ id_entitie: 7, id_branch: 5 }),
    });
    expect(httpMock).toHaveBeenNthCalledWith(4, {
      method: "get",
      url: URL_MAIN + "obtener_existe_datos_config",
      params: { id_branch: 5 },
      headers: JSON_HEADERS,
    });
    expect(store.commit).toHaveBeenCalledWith("_setItemsMenu", menu);
    expect(store.state.dataMenu).toBe(false);
    expect(store.state.lstMenu).toEqual(menu);
    expect(sessionOf("menu")).toBe(JSON.stringify(menu));
    expect(localOf("ConfigEmpresa")).toBe(JSON.stringify(config));
  });

  test("singin sends a new company with one branch to the initial configuration", async () => {
    vi.useFakeTimers();
    respond({
      singin: { estadoflag: true, mensaje: "", token: "tok", data: [{ ...loginRow }] },
      "CargarBranch/7": { data: [{ ...branch, esnuevoflag: true }] },
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

  test("singin rejects with the error message cleared when the request fails", async () => {
    respond({ singin: new Error("Network Error") });
    const { securitys } = setup();
    securitys.errorClave = "previo";

    await expect(securitys.singin()).rejects.toThrow("Network Error");
    expect(securitys.errorClave).toBe("");
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

    await securitys.ReEstablecerContrasenia();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", html: "Correo no registrado" });
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
