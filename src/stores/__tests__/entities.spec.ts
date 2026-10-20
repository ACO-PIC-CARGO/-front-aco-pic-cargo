import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "somewhere", params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const postMock = (http as unknown as { post: Mock }).post;
const currentRoute = router.currentRoute as unknown as { value: { name: string; params: Record<string, unknown> } };
const rootState = () => useAppStore();
const sentUrls = () => httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length));
const swalCall = (n = 0) => vi.mocked(Swal.fire).mock.calls[n]![0];

const phone = { id_tipotelefono: 2, telefono: "999" };
const contact = { nombre: "Luis", id_tipotelefono: 3, telefono: "888" };
const agreement = { id: 1, fecha: "2026-01-01", dias_credito: 30, email_soporte: "" };
const detailLists = {
  lsttelefonos: [phone],
  lstcontactos: [contact],
  lstconvenios: [agreement],
  lsttarifas: [{ id: 2, fecha: "2026-01-02", codigo: "T00001", tarifa: 10 }],
  lstcuentas: [{ nro_cuenta: "123", cci: "456", id_banco: 1, id_coins: 2 }],
  lstemails: [{ id: 5, description: "Ventas", email: "v@x.com", estado: true }],
};

describe("entities store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, usuario: "ana" }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    currentRoute.value = { name: "somewhere", params: {} };
    Object.assign(useAppStore(), { modalEntitie: false, registroClienteFlag: false });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("getListClientes builds the query from the filter and keeps the rows", async () => {
    respond({ listado_clientes: accepted([{ id: 1, nombrecompleto: "Ana" }]) });
    const entities = useEntitiesStore();
    Object.assign(entities.filtro, {
      correlativo: "12",
      nombrecompleto: "Ana",
      id_document: 3,
      nro_documento: null,
      id_pais: 9,
      id_state: null,
      status: "0",
      id_tipoproveedor: "",
    });

    await entities.getListClientes();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url:
        URL_MAIN +
        "listado_clientes?id_branch=7&correlativo=12&nombrecompleto=Ana&id_document=3&nro_documento=&id_pais=9&id_state=&status=0&id_tipoproveedor=",
      headers: JSON_HEADERS,
    });
    expect(entities.lstProveedor).toEqual([{ id: 1, nombrecompleto: "Ana" }]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("getListClientes sends an empty status for any status other than 1 or 0", async () => {
    respond({ listado_clientes: accepted([]) });
    const entities = useEntitiesStore();
    entities.filtro.status = "";

    await entities.getListClientes();

    expect(sentUrls()[0]).toMatch(/&status=&id_tipoproveedor=$/);
  });

  test("getListClientes empties the list and tells the user when the backend rejects", async () => {
    respond({ listado_clientes: rejected() });
    const entities = useEntitiesStore();
    entities.lstProveedor = [{ id: 9 }];

    await entities.getListClientes();
    await flushPromises();

    expect(entities.lstProveedor).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "info",
      text: "No se encontraron registros",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("getListClientes sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ listado_clientes: rejected("Token vencido", "401") });

    await useEntitiesStore().getListClientes();
    await flushPromises();

    expect(swalCall()).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("getListProveedor builds the supplier query and keeps the list when the request fails", async () => {
    respond({ listado_proveedor: new Error("network") });
    const entities = useEntitiesStore();
    entities.lstProveedor = [{ id: 9 }];
    Object.assign(entities.filtro, { bussiness_name: "ACME", producto: "Café", id_tipoproveedor: 4, status: 1 });

    await entities.getListProveedor();

    expect(sentUrls()).toEqual([
      "listado_proveedor?id_branch=7&correlativo=&bussiness_name=ACME&id_document=&nro_documento=&id_tipoproveedor=4&producto=Café&id_pais=&id_state=&status=1",
    ]);
    expect(entities.lstProveedor).toEqual([{ id: 9 }]);
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });

  test("verCliente loads the given id and spreads the detail into the step lists", async () => {
    const detail = {
      id: 5,
      nombrecompleto: "Ana",
      ...detailLists,
      lstshippers: [{ id_shipper: 8, nombrecompleto: "Ship" }],
      informacionentrega: [{ destinatario: "Ana", status: true }],
    };
    respond({ ver_cliente: accepted([detail]) });
    currentRoute.value.params = { id: 99 };
    const entities = useEntitiesStore();

    await entities.verCliente(5);

    expect(sentUrls()).toEqual(["ver_cliente?id=5"]);
    expect(entities.cliente.nombrecompleto).toBe("Ana");
    expect(entities.lstTelefonos).toEqual([{ id_tipotelefono: "2", telefono: "999" }]);
    expect(entities.lstContactos).toEqual([{ nombre: "Luis", id_tipotelefono: "3", telefono: "888" }]);
    expect(entities.lstConvenios).toEqual(detailLists.lstconvenios);
    expect(entities.lstTarifas).toEqual(detailLists.lsttarifas);
    expect(entities.lstInformacionBancaria).toEqual(detailLists.lstcuentas);
    expect(entities.lstEmails).toEqual(detailLists.lstemails);
    expect(entities.lstShippers).toEqual([{ id_shipper: 8, nombrecompleto: "Ship" }]);
    expect(entities.informacionEntrega).toEqual({ destinatario: "Ana", status: true });
    expect(entities.cliente.convenioActual).toBe(entities.lstConvenios[0]);
    expect(entities.cliente.telefonoActual).toBe(entities.lstTelefonos[0]);
    expect(entities.cliente.contactoActual).toBe(entities.lstContactos[0]);
  });

  test("verCliente reads the route id and starts blank current entries when the client has no lists", async () => {
    const empty = { lsttelefonos: [], lstcontactos: [], lstconvenios: [], lsttarifas: [], lstcuentas: [], lstemails: [] };
    respond({ ver_cliente: accepted([{ id: 9, ...empty, lstshippers: [], informacionentrega: [] }]) });
    currentRoute.value.params = { id: 9 };
    const entities = useEntitiesStore();

    await entities.verCliente();

    expect(sentUrls()).toEqual(["ver_cliente?id=9"]);
    expect(entities.informacionEntrega).toEqual({ status: true });
    expect(entities.cliente.convenioActual).toEqual({ dias_credito: 0, fecha: "", email_soporte: "" });
    expect(entities.cliente.telefonoActual).toEqual({ id_tipotelefono: "", telefono: "" });
    expect(entities.cliente.contactoActual).toEqual({ nombre: "", id_tipotelefono: "", telefono: "" });
  });

  test("verCliente sends the user back to the supplier list when the client does not exist", async () => {
    respond({ ver_cliente: rejected("No existe") });
    const entities = useEntitiesStore();
    entities.lstProveedor = [{ id: 1 }];

    await entities.verCliente(5);
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "Aviso",
      text: "No existe",
      allowOutsideClick: false,
      confirmButtonText: "Ir al listado",
    });
    expect(entities.lstProveedor).toEqual([]);
    expect(router.push).toHaveBeenCalledWith({ name: "listProveedor" });
  });

  test("verCliente sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ ver_cliente: rejected("Token vencido", "401") });

    await useEntitiesStore().verCliente(5);
    await flushPromises();

    expect(swalCall()).toMatchObject({ icon: "error", text: "Token vencido", allowEnterKey: false });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("getVerProveedor loads the route supplier and spreads the detail into the step lists", async () => {
    respond({ ver_proveedor: accepted([{ id: 64, bussiness_name: "ACME", ...detailLists }]) });
    currentRoute.value.params = { id: 64 };
    const entities = useEntitiesStore();

    await entities.getVerProveedor();

    expect(sentUrls()).toEqual(["ver_proveedor?id=64"]);
    expect(entities.proveedor.bussiness_name).toBe("ACME");
    expect(entities.lstTelefonos).toEqual([{ id_tipotelefono: "2", telefono: "999" }]);
    expect(entities.lstContactos).toEqual([{ nombre: "Luis", id_tipotelefono: "3", telefono: "888" }]);
    expect(entities.lstInformacionBancaria).toEqual(detailLists.lstcuentas);
    expect(entities.lstEmails).toEqual(detailLists.lstemails);
    expect(entities.proveedor.convenioActual).toBe(entities.lstConvenios[0]);
    expect(entities.proveedor.telefonoActual).toBe(entities.lstTelefonos[0]);
    expect(entities.proveedor.contactoActual).toBe(entities.lstContactos[0]);
  });

  test("getVerProveedor sends the user back to the supplier list when the supplier does not exist", async () => {
    respond({ ver_proveedor: rejected("No existe") });
    const entities = useEntitiesStore();
    entities.lstProveedor = [{ id: 1 }];

    await entities.getVerProveedor();
    await flushPromises();

    expect(swalCall()).toMatchObject({ icon: "error", title: "Aviso", confirmButtonText: "Ir al listado" });
    expect(entities.lstProveedor).toEqual([]);
    expect(router.push).toHaveBeenCalledWith({ name: "listProveedor" });
  });

  test("guardarCliente copies the step lists into the client, posts it and opens the client list", async () => {
    respond({ registrar_cliente: accepted([{ id_entitie: 33 }]) });
    const entities = useEntitiesStore();
    entities.cliente.nombrecompleto = "Ana";
    entities.lstTelefonos = [{ id_tipotelefono: "2", telefono: "999" }];
    entities.lstShippers = [{ id_shipper: 8 }];
    entities.informacionEntrega = { status: true };
    entities.lstProveedor = [{ id: 1 }];

    await entities.guardarCliente();
    await flushPromises();

    const sent = httpMock.mock.calls[0]![0];
    expect(sent).toMatchObject({ method: "post", url: URL_MAIN + "registrar_cliente", headers: JSON_HEADERS });
    expect(sent.data).toMatchObject({
      nombrecompleto: "Ana",
      id_branch: 7,
      lstTelefonos: [{ id_tipotelefono: "2", telefono: "999" }],
      lstContactos: [],
      lstShippers: [{ id_shipper: 8 }],
      informacionEntrega: { status: true },
      lstEmails: [],
    });
    expect(swalCall()).toMatchObject({ icon: "success", confirmButtonText: "Ir al listado" });
    expect(entities.lstProveedor).toEqual([]);
    expect(router.push).toHaveBeenCalledWith({ name: "listClientes" });
  });

  test("guardarCliente from the client dialog keeps the new id, flips the registration flag and closes the dialog", async () => {
    respond({ registrar_cliente: accepted([{ id_entitie: 33 }]) });
    const entities = useEntitiesStore();
    Object.assign(useAppStore(), { modalEntitie: true, registroClienteFlag: false });

    await entities.guardarCliente();
    await flushPromises();

    expect(swalCall()).toMatchObject({ confirmButtonText: "Aceptar" });
    expect(entities.id).toBe(33);
    expect(rootState()).toMatchObject({ registroClienteFlag: true, modalEntitie: false });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("guardarCliente sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ registrar_cliente: rejected("Token vencido", "401") });

    await useEntitiesStore().guardarCliente();
    await flushPromises();

    expect(swalCall()).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("guardarProveedor posts the supplier with its tariff contacts and returns the answer", async () => {
    const answer = accepted([{ id_entitie: 40 }]);
    respond({ registrar_proveedor: answer });
    const entities = useEntitiesStore();
    entities.itemsImportacion = [{ id: 0, code: "I", contacto: "a", email: "", telefono: "" }];
    entities.itemsExportacion = [{ id: 0, code: "E", contacto: "b", email: "", telefono: "" }];

    const res = await entities.guardarProveedor();
    await flushPromises();

    expect(res).toEqual(answer);
    expect(httpMock.mock.calls[0]![0].data).toMatchObject({
      id_branch: 7,
      datosTarifa: [{ code: "I" }, { code: "E" }],
      lstTarifas: [],
      lstInformacionBancaria: [],
    });
    expect(swalCall()).toMatchObject({ icon: "success", confirmButtonText: "Ir al listado" });
    expect(router.push).toHaveBeenCalledWith({ name: "listProveedor" });
  });

  test("guardarProveedor from a quote screen saves without any dialog", async () => {
    respond({ registrar_proveedor: accepted([{ id_entitie: 40 }]) });
    currentRoute.value.name = "editQuote";

    await useEntitiesStore().guardarProveedor();
    await flushPromises();

    expect(Swal.fire).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  test("guardarProveedor from the client dialog keeps the new id and closes the dialog", async () => {
    respond({ registrar_proveedor: accepted([{ id_entitie: 40 }]) });
    const entities = useEntitiesStore();
    Object.assign(useAppStore(), { modalEntitie: true, registroClienteFlag: true });

    await entities.guardarProveedor();
    await flushPromises();

    expect(entities.id).toBe(40);
    expect(rootState()).toMatchObject({ registroClienteFlag: false, modalEntitie: false });
  });

  test("guardarProveedor returns an empty answer when the request fails", async () => {
    respond({ registrar_proveedor: new Error("network") });

    expect(await useEntitiesStore().guardarProveedor()).toEqual({});
  });

  test("actualizarCliente sends the client with the route name and the session user", async () => {
    respond({ actualizar_cliente: accepted([]) });
    currentRoute.value.name = "editarCliente";
    const entities = useEntitiesStore();
    entities.lstConvenios = [{ dias_credito: 5 }];

    await entities.actualizarCliente();
    await flushPromises();

    const sent = httpMock.mock.calls[0]![0];
    expect(sent).toMatchObject({ method: "put", url: URL_MAIN + "actualizar_cliente" });
    expect(sent.data).toMatchObject({ rute: "editarCliente", usuario: "ana", id_branch: 7, lstConvenios: [{ dias_credito: 5 }] });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "Aviso", text: "ok", allowOutsideClick: false });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("actualizarProveedor puts the supplier and opens the supplier list", async () => {
    respond({ actualizar_proveedor: rejected("Error") });
    const entities = useEntitiesStore();
    entities.lstEmails = [{ id: 1, description: "a", email: "a@b.co", estado: true }];

    await entities.actualizarProveedor();
    await flushPromises();

    expect(httpMock.mock.calls[0]![0].data).toMatchObject({ id_branch: 7, lstEmails: [{ id: 1 }] });
    expect(swalCall()).toMatchObject({ icon: "error", text: "Error", confirmButtonText: "Ir al listado" });
    expect(router.push).toHaveBeenCalledWith({ name: "listProveedor" });
  });

  test("eliminarPersona shows the result and reloads the supplier list", async () => {
    respond({ eliminar_proveedor: accepted([]), listado_proveedor: accepted([{ id: 3 }]) });
    const entities = useEntitiesStore();

    await entities.eliminarPersona({ id: 3 });
    await flushPromises();

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "put", data: { id: 3 } });
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "success",
      title: "Aviso",
      text: "ok",
      allowOutsideClick: false,
      confirmButtonText: "Aceptar",
    });
    expect(sentUrls()[1]).toMatch(/^listado_proveedor\?/);
    expect(entities.lstProveedor).toEqual([{ id: 3 }]);
  });

  test("telConctactoProveedor turns the phone types into strings and blanks the missing ones", async () => {
    respond({
      tel_contacto_proveedor: accepted([
        { lsttelefono: [{ id_tipotelefono: 3, telefono: "1" }, { id_tipotelefono: null }], lstcontactos: [{ id_tipotelefono: 0 }] },
      ]),
    });
    const entities = useEntitiesStore();

    await entities.telConctactoProveedor({ id: 4 });

    expect(sentUrls()).toEqual(["tel_contacto_proveedor?id=4"]);
    expect(entities.lstTelefono).toEqual([{ id_tipotelefono: "3", telefono: "1" }, { id_tipotelefono: "" }]);
    expect(entities.lstContactos).toEqual([{ id_tipotelefono: "" }]);
  });

  test("guardarRolProveedor sends every persona flag as a column", async () => {
    respond({ actualizar_rol_proveedor: accepted([]) });
    const entities = useEntitiesStore();
    entities.lstPersona = [
      { id: 1, nombrecompleto: "A", proveedorflag: true, clienteflag: false, personalflag: false },
      { id: 2, nombrecompleto: "B", proveedorflag: false, clienteflag: true, personalflag: true },
    ];

    await entities.guardarRolProveedor();

    expect(httpMock.mock.calls[0]![0].data).toEqual({
      id: [1, 2],
      proveedorflag: [true, false],
      clienteflag: [false, true],
      personalflag: [false, true],
    });
    expect(swalCall()).toMatchObject({ icon: "success", confirmButtonText: "Ok" });
  });

  test("exportListClientes posts the filter with blank fallbacks and downloads the sheet", async () => {
    URL.createObjectURL = vi.fn(() => "blob:sheet");
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    postMock.mockResolvedValue({ data: new ArrayBuffer(1) });
    const entities = useEntitiesStore();
    Object.assign(entities.filtro, { correlativo: null, names: "Ana", status: 3 });

    await entities.exportListClientes();

    const [url, body, config] = postMock.mock.calls[0]!;
    expect(url).toBe(URL_MAIN + "export_list_cliente");
    expect(body).toEqual({
      id_branch: 7,
      correlativo: "",
      names: "Ana",
      surname: "",
      second_surname: "",
      id_document: "",
      id_pais: "",
      id_state: "",
      status: "",
      id_tipoproveedor: "",
    });
    expect(config).toMatchObject({ responseType: "arraybuffer" });
    expect(click).toHaveBeenCalledTimes(1);
    expect(vi.mocked(Swal.fire).mock.calls.map(([options]) => (options as SweetAlertOptions).text)).toEqual([
      "El documento se descargará automaticamente",
      "Documento Descargado",
    ]);
  });

  test("exportListProveedor posts the raw filter", async () => {
    URL.createObjectURL = vi.fn(() => "blob:sheet");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    postMock.mockResolvedValue({ data: new ArrayBuffer(1) });
    const entities = useEntitiesStore();
    Object.assign(entities.filtro, { correlativo: null, bussiness_name: "ACME" });

    await entities.exportListProveedor();

    expect(postMock.mock.calls[0]![0]).toBe(URL_MAIN + "export_list_proveedor");
    expect(postMock.mock.calls[0]![1]).toEqual({
      id_branch: 7,
      correlativo: null,
      bussiness_name: "ACME",
      id_document: "",
      id_pais: "",
      id_state: "",
      status: "1",
      id_tipoproveedor: "",
    });
  });

  test("cargarDatosTatifasEntite keeps the tariff contacts of the first row, or none when rejected", async () => {
    const datos = [{ id: 1, code: "I", contacto: "c", email: "", telefono: "" }];
    respond({ "entitie/cargar_datos_tarifas": accepted([{ datos }]) });
    const entities = useEntitiesStore();

    await entities.cargarDatosTatifasEntite({ id: 4 });

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "get", params: { id: 4 } });
    expect(entities.lstDatosTarifas).toEqual(datos);

    respond({ "entitie/cargar_datos_tarifas": rejected() });
    await entities.cargarDatosTatifasEntite({ id: 4 });
    expect(entities.lstDatosTarifas).toEqual([]);
  });

  test("validarClienteTieneMovimientos returns the check, or an empty answer when the request fails", async () => {
    respond({ "entities/validar_eliminar_cliente": accepted({ estadoflag: false, mensaje: "Tiene casas" }) });
    const entities = useEntitiesStore();

    expect(await entities.validarClienteTieneMovimientos({ id: 4 })).toEqual({ estadoflag: false, mensaje: "Tiene casas" });
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ params: { id: 4 } });

    respond({ "entities/validar_eliminar_cliente": new Error("network") });
    expect(await entities.validarClienteTieneMovimientos({ id: 4 })).toEqual({});
  });

  test.each([
    ["validarNombreCliente", "validar_nombre_cliente?id_branch=7&nombre=Ana", "lstProveedores_x_nombre"],
    ["validarDocumentoCliente", "validar_documento_cliente?id_branch=7&id_tipodocumento=1&nro_documento=", "lstProveedores_x_documento"],
    ["validarNombreProveedor", "validar_nombre_proveedor?id_branch=7&nombre=", "lstProveedores_x_nombre"],
    ["validarDocumentoProveedor", "validar_documento_proveedor?id_branch=7&id_tipodocumento=&nro_documento=55", "lstProveedores_x_documento"],
  ] as const)("%s looks up the matches and keeps them, or none when rejected", async (action, url, list) => {
    respond({ [url.split("?")[0]!]: accepted([{ id: 1, nombrecompleto: "Ana" }]) });
    const entities = useEntitiesStore();
    Object.assign(entities.cliente, { nombrecompleto: "Ana", id_tipodocumento: 1, nro_documento: "" });
    Object.assign(entities.proveedor, { nombrecompleto: "", id_tipodocumento: 0, nro_documento: "55" });

    await entities[action]();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + url, headers: JSON_HEADERS, data: {} });
    expect(entities[list]).toEqual([{ id: 1, nombrecompleto: "Ana" }]);

    respond({ [url.split("?")[0]!]: rejected() });
    await entities[action]();
    expect(entities[list]).toEqual([]);
  });

  test.each([
    ["getValidaRazonSocial", "validar_razon_social?id_branch=7&razonsocial=ACME"],
    ["getValidaDocument", "validar_documento?id_branch=7&id_tipodocumento=0&documento=55"],
    ["getValidaDocumentCliente", "validar_documento?id_branch=7&id_tipodocumento=1&documento=77"],
  ] as const)("%s checks the backend and keeps its rows as the list", async (action, url) => {
    respond({ [url.split("?")[0]!]: accepted([{ id: 2 }]) });
    const entities = useEntitiesStore();
    Object.assign(entities.proveedor, { bussiness_name: "ACME", nro_documento: "55" });
    Object.assign(entities.cliente, { id_tipodocumento: 1, nro_documento: "77" });

    await entities[action]();

    expect(sentUrls()).toEqual([url]);
    expect(entities.lstProveedor).toEqual([{ id: 2 }]);

    respond({ [url.split("?")[0]!]: rejected() });
    await entities[action]();
    expect(entities.lstProveedor).toEqual([]);
  });

  test.each([
    ["CargarPersona", "cargar_persona", "persona"],
    ["ListarPersonaTipoPersona", "listar_persona_tipo_persona", "lstPersona"],
  ] as const)("%s keeps the branch rows, or none when rejected", async (action, path, list) => {
    const rows = [{ id: 1, nombrecompleto: "A", proveedorflag: true, clienteflag: false, personalflag: false }];
    respond({ [path]: accepted(rows) });
    const entities = useEntitiesStore();

    await entities[action]();

    expect(sentUrls()).toEqual([`${path}?id_branch=7`]);
    expect(entities[list]).toEqual(rows);

    respond({ [path]: rejected() });
    await entities[action]();
    expect(entities[list]).toEqual([]);
  });
});
