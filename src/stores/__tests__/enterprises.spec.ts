import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useEnterprisesStore } from "@/stores/enterprises";
import { useUserStore } from "@/stores/user";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "somewhere" } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const acme = { id: 4, trade_name: "ACME", business_name: "ACME SAC", status: 1 };
const defaultListParams = {
  id_branch: 7,
  document: "",
  trade_name: "",
  business_name: "",
  address: "",
  status: 1,
  id_pais: "",
  id_state: "",
  id_city: "",
  id_town: "",
  id_document: "",
};
const currentRoute = router.currentRoute as unknown as { value: { name: string } };
const sentUrls = () => httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length));

describe("enterprises store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    currentRoute.value.name = "somewhere";
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("fetchDataEnterprise stamps the session branch on the filter, lists the rows and marks the list loaded", async () => {
    const enterprises = useEnterprisesStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = enterprises.loading;
      return { data: accepted([acme]) };
    });
    enterprises.loading = true;
    const filter = { id_branch: 99, trade_name: "AC" };

    await enterprises.fetchDataEnterprise(filter);
    await flushPromises();

    expect(filter.id_branch).toBe(7);
    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_enterprise",
      params: filter,
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(enterprises.list).toEqual([acme]);
    expect(enterprises.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("fetchDataEnterprise returns before the backend answers", async () => {
    let answer: (value: { data: unknown }) => void = () => {};
    httpMock.mockImplementation(() => new Promise((resolve) => (answer = resolve)));
    const enterprises = useEnterprisesStore();

    await enterprises.fetchDataEnterprise({});

    expect(enterprises.loading).toBe(false);
    answer({ data: accepted([acme]) });
    await flushPromises();
    expect(enterprises.list).toEqual([acme]);
  });

  test("fetchDataEnterprise empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_enterprise: rejected() });
    const enterprises = useEnterprisesStore();
    enterprises.list = [{ id: 1 }];

    await enterprises.fetchDataEnterprise({});
    await flushPromises();

    expect(enterprises.list).toEqual([]);
    expect(enterprises.loading).toBe(true);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "info",
      text: "No se encontraron registros",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("fetchDataEnterprise sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listar_enterprise: rejected("Token vencido", "401") });

    await useEnterprisesStore().fetchDataEnterprise({});
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataEnterprise keeps the list and the loading flag when the request fails", async () => {
    respond({ listar_enterprise: new Error("network") });
    const enterprises = useEnterprisesStore();
    enterprises.list = [{ id: 1 }];

    await enterprises.fetchDataEnterprise({});
    await flushPromises();

    expect(enterprises.list).toEqual([{ id: 1 }]);
    expect(enterprises.loading).toBe(false);
    expect(console.log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  test("readEnterprise keeps the first row as the record", async () => {
    respond({ ver_enterprise: accepted([acme, { id: 5 }]) });
    const enterprises = useEnterprisesStore();

    await enterprises.readEnterprise(4);
    await flushPromises();

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "get", url: URL_MAIN + "ver_enterprise?id=4" });
    expect(enterprises.record).toEqual(acme);
  });

  test("readEnterprise shows the backend message as an error and keeps the record when the backend rejects", async () => {
    respond({ ver_enterprise: rejected("No existe") });
    const enterprises = useEnterprisesStore();
    enterprises.record = { id: 1 };

    await enterprises.readEnterprise(4);
    await flushPromises();

    expect(enterprises.record).toEqual({ id: 1 });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test("insertEnterprise posts the admin user with the enterprise form and opens the list once the user accepts", async () => {
    respond({ insertar_enterprise: accepted([]) });
    const enterprises = useEnterprisesStore();
    enterprises.model.trade_name = "NEW CO";
    useUserStore().model.names = "Ana";

    await enterprises.insertEnterprise();
    await flushPromises();

    const sent = httpMock.mock.calls[0]![0];
    expect(sent).toMatchObject({ method: "post", url: URL_MAIN + "insertar_enterprise", headers: JSON_HEADERS });
    expect(sent.data).toMatchObject({ user: { names: "Ana" }, enterprise: { trade_name: "NEW CO", status: "1" } });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(router.push).toHaveBeenCalledWith("listado");
  });

  test("insertEnterprise shows the backend error and still opens the list once the user accepts", async () => {
    respond({ insertar_enterprise: rejected("Duplicado") });

    await useEnterprisesStore().insertEnterprise();
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(router.push).toHaveBeenCalledWith("listado");
  });

  test("updateEnterprise puts the record and opens the list when the user is on another screen", async () => {
    respond({ actualizar_enterprise: accepted([]) });

    await useEnterprisesStore().updateEnterprise({ id: 4, trade_name: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "actualizar_enterprise",
      headers: JSON_HEADERS,
      data: { id: 4, trade_name: "X" },
    });
    expect(router.push).toHaveBeenCalledWith({ name: "listEnterprise" });
    expect(sentUrls()).toEqual(["actualizar_enterprise"]);
  });

  test("updateEnterprise reloads the active list in the order the backend filter expects when the user is already on it", async () => {
    currentRoute.value.name = "listEnterprise";
    respond({ actualizar_enterprise: accepted([]), listar_enterprise: accepted([acme]) });
    const enterprises = useEnterprisesStore();

    await enterprises.updateEnterprise({ id: 4 });
    await flushPromises();

    expect(router.push).not.toHaveBeenCalled();
    const params = httpMock.mock.calls[1]![0].params;
    expect(params).toEqual(defaultListParams);
    expect(Object.keys(params!)).toEqual(Object.keys(defaultListParams));
    expect(enterprises.list).toEqual([acme]);
  });

  test("eliminarBranch deletes the branch, shows the backend error and reloads the active list", async () => {
    currentRoute.value.name = "listEnterprise";
    respond({ eliminar_sucursal: rejected("No se puede"), listar_enterprise: accepted([]) });

    await useEnterprisesStore().eliminarBranch({ id: 4, status: 0 });
    await flushPromises();

    expect(httpMock.mock.calls[0]![0]).toMatchObject({
      method: "delete",
      url: URL_MAIN + "eliminar_sucursal",
      data: { id: 4, status: 0 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "No se puede" });
    expect(sentUrls()).toEqual(["eliminar_sucursal", "listar_enterprise"]);
  });

  test("eliminarBranch opens the list when the user is on another screen", async () => {
    respond({ eliminar_sucursal: accepted([]) });

    await useEnterprisesStore().eliminarBranch({ id: 4 });
    await flushPromises();

    expect(router.push).toHaveBeenCalledWith({ name: "listEnterprise" });
  });

  test("RegistroNuevaEmpresa signs the new admin in on both storages and reports success", async () => {
    const created = {
      data_users: [{ id: 11, id_entitie: 22, id_branch: 33 }],
      data_branch: [{ id: 33, esnuevoflag: true }],
    };
    respond({ registro_nueva_empresa: accepted([created]) });
    const enterprises = useEnterprisesStore();
    enterprises.data.email = "ana@acme.pe";

    const result = await enterprises.RegistroNuevaEmpresa();

    expect(httpMock.mock.calls[0]![0]).toMatchObject({
      method: "post",
      url: URL_MAIN + "registro_nueva_empresa",
      data: expect.objectContaining({ email: "ana@acme.pe" }),
    });
    const signedIn = [{ id: 22, id_entitie: 22, id_branch: 33, id_user: 11 }];
    for (const storage of [sessionStorage, localStorage]) {
      expect(JSON.parse(storage.getItem("dataUser")!)).toEqual(signedIn);
      expect(storage.getItem("auth-token")).toBe("tok");
      expect(JSON.parse(storage.getItem("dataBranch")!)).toEqual([{ id: 33, esnuevoflag: true }]);
    }
    expect(sessionStorage.getItem("security")).toBe("undefined");
    expect(localStorage.getItem("security")).toBeNull();
    expect(result).toBe(true);
  });

  test("RegistroNuevaEmpresa reports success and signs nobody in when the request fails", async () => {
    respond({ registro_nueva_empresa: new Error("network") });
    const before = sessionStorage.getItem("dataUser");

    const result = await useEnterprisesStore().RegistroNuevaEmpresa();

    expect(result).toBe(true);
    expect(sessionStorage.getItem("dataUser")).toBe(before);
    expect(localStorage.getItem("dataUser")).toBeNull();
  });

  test("the registration checks send the typed email and code and give back the backend answer", async () => {
    respond({
      enviar_codigo_validacion_email: accepted([]),
      validar_token_registro: accepted([]),
      validar_correo_registro: accepted([]),
    });
    const enterprises = useEnterprisesStore();
    enterprises.data.email = "ana@acme.pe";
    enterprises.data.codigo = "1234";

    await enterprises.enviarCorreoValidacion();
    const token = await enterprises.validarCodigoVerificacion(true);
    const tokenKept = await enterprises.validarCodigoVerificacion();
    const email = await enterprises.validarCorreoRegistro();

    expect(sentUrls()).toEqual([
      "enviar_codigo_validacion_email?email=ana@acme.pe",
      "validar_token_registro?email=ana@acme.pe&codigo=1234&eliminartoken=true",
      "validar_token_registro?email=ana@acme.pe&codigo=1234&eliminartoken=false",
      "validar_correo_registro?email=ana@acme.pe",
    ]);
    expect(token.estadoflag).toBe(true);
    expect(tokenKept.estadoflag).toBe(true);
    expect(email!.estadoflag).toBe(true);
  });

  test("the registration checks answer with an empty result when the request fails", async () => {
    respond({ validar_token_registro: new Error("network"), validar_correo_registro: new Error("network") });
    const enterprises = useEnterprisesStore();

    expect(await enterprises.validarCodigoVerificacion()).toEqual([]);
    expect(await enterprises.validarCorreoRegistro()).toBeNull();
  });

  test("obtenerImpuestoXEmpresa keeps the first tax row of the given branch or of the session branch", async () => {
    respond({ obtener_impuestos_branch: accepted([{ nombre_impuesto: "IGV", impuesto: 18 }, { nombre_impuesto: "X" }]) });
    const enterprises = useEnterprisesStore();

    await enterprises.obtenerImpuestoXEmpresa(5);
    await enterprises.obtenerImpuestoXEmpresa();

    expect(sentUrls()).toEqual(["obtener_impuestos_branch?id_branch=5", "obtener_impuestos_branch?id_branch=7"]);
    expect(enterprises.impuesto).toEqual({ nombre_impuesto: "IGV", impuesto: 18 });
  });

  test("obtenerImpuestoXEmpresa keeps the previous tax and logs when the request fails", async () => {
    respond({ obtener_impuestos_branch: new Error("network") });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const enterprises = useEnterprisesStore();
    enterprises.impuesto = { nombre_impuesto: "IGV" };

    await enterprises.obtenerImpuestoXEmpresa();

    expect(enterprises.impuesto).toEqual({ nombre_impuesto: "IGV" });
    expect(error).toHaveBeenCalled();
  });

  test("listarCuentaEmpresa lists the accounts of the session branch", async () => {
    respond({ listado_cuentas_empresa: accepted([{ nrocuenta: "1", esprincipalflag: true }]) });
    const enterprises = useEnterprisesStore();

    await enterprises.listarCuentaEmpresa();

    expect(sentUrls()).toEqual(["listado_cuentas_empresa?id_branch=7"]);
    expect(enterprises.lstCuentas).toEqual([{ nrocuenta: "1", esprincipalflag: true }]);
  });

  test("registrarCuentaEmpresa stamps the session branch, shows the answer and reloads the accounts", async () => {
    respond({ banco_registrar: accepted([]), listado_cuentas_empresa: accepted([{ nrocuenta: "9", esprincipalflag: false }]) });
    const enterprises = useEnterprisesStore();
    const account = { id_banco: 0, id_coins: 1, numerocuenta: "9", cci: "2", esprincipalflag: false, acronymbanco: "A", nombrebanco: "B" };

    await enterprises.registrarCuentaEmpresa(account);
    await flushPromises();

    expect(httpMock.mock.calls[0]![0]).toMatchObject({
      method: "post",
      url: URL_MAIN + "banco_registrar",
      data: { ...account, id_branch: 7 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(sentUrls()).toEqual(["banco_registrar", "listado_cuentas_empresa?id_branch=7"]);
    expect(enterprises.lstCuentas).toEqual([{ nrocuenta: "9", esprincipalflag: false }]);
  });
});
