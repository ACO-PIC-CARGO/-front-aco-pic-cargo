import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2";
import http from "@/api/http";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { name: "somewhere", params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showValidationMessage: vi.fn() } }));

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
      id_tipoproveedor: 4,
    });

    await entities.getListClientes();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listado_clientes",
      params: {
        correlativo: "12",
        nombrecompleto: "Ana",
        id_document: 3,
        nro_documento: "",
        id_pais: 9,
        id_state: "",
        status: "0",
      },
    });
    expect(entities.lstProveedor).toEqual([{ id: 1, nombrecompleto: "Ana" }]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("getListClientes sends an empty status for any status other than 1 or 0", async () => {
    respond({ listado_clientes: accepted([]) });
    const entities = useEntitiesStore();
    entities.filtro.status = "";

    await entities.getListClientes();

    expect(httpMock.mock.calls[0]![0].params).toMatchObject({ status: "" });
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

    expect(httpMock.mock.calls[0]![0]).toMatchObject({
      url: URL_MAIN + "listado_proveedor",
      params: { bussiness_name: "ACME", id_tipoproveedor: 4, producto: "Café", status: 1 },
    });
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

  test("verCliente sends the user back to the client list when the client does not exist", async () => {
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
    expect(router.push).toHaveBeenCalledWith({ name: "listClientes" });
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

  test("getVerProveedor loads a provider whose phones or contacts have no type", async () => {
    respond({
      ver_proveedor: accepted([
        {
          id: 64,
          ...detailLists,
          lsttelefonos: [{ id: 1, id_tipotelefono: null, telefono: "999" }],
          lstcontactos: [{ id: 2, nombre: "Luis", id_tipotelefono: null, telefono: "888" }],
        },
      ]),
    });
    const entities = useEntitiesStore();

    await entities.getVerProveedor();

    expect(entities.lstTelefonos).toEqual([{ id: 1, id_tipotelefono: "", telefono: "999" }]);
    expect(entities.lstContactos).toEqual([{ id: 2, nombre: "Luis", id_tipotelefono: "", telefono: "888" }]);
  });

  test("a provider that fails to load leaves no stale rows and cannot be saved", async () => {
    respond({ ver_proveedor: new Error("network"), actualizar_proveedor: accepted([]) });
    const entities = useEntitiesStore();
    Object.assign(entities, {
      lstTelefonos: [{ id: 1, id_tipotelefono: "2", telefono: "999" }],
      lstContactos: [{ id: 2, nombre: "Luis", id_tipotelefono: "3", telefono: "888" }],
      lstConvenios: [{ id: 3, dias_credito: 5 }],
      lstTarifas: [{ id: 4, codigo: "T00001" }],
      lstInformacionBancaria: [{ id: 5, nro_cuenta: "1" }],
      lstEmails: [{ id: 6, description: "a", email: "a@b.co", estado: true }],
    });

    await entities.getVerProveedor();
    const saved = await entities.actualizarProveedor();

    expect(entities).toMatchObject({
      lstTelefonos: [],
      lstContactos: [],
      lstConvenios: [],
      lstTarifas: [],
      lstInformacionBancaria: [],
      lstEmails: [],
    });
    expect(saved).toBe(false);
    expect(sentUrls()).not.toContain("actualizar_proveedor");
    expect(swalCall()).toMatchObject({ icon: "error" });
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

  test("actualizarCliente saves the client and reloads it so new rows carry their ids", async () => {
    const empty = { lstcontactos: [], lstconvenios: [], lsttarifas: [], lstcuentas: [], lstemails: [], lstshippers: [] };
    respond({
      actualizar_cliente: accepted([]),
      ver_cliente: accepted([{ id: 5, ...empty, lsttelefonos: [{ id: 9, id_tipotelefono: 2, telefono: "999" }], informacionentrega: [] }]),
    });
    currentRoute.value.name = "editarCliente";
    const entities = useEntitiesStore();
    entities.cliente.id = 5;
    entities.lstTelefonos = [{ id_tipotelefono: "2", telefono: "999" }];

    expect(await entities.actualizarCliente()).toBe(true);

    expect(sentUrls()).toEqual(["actualizar_cliente", "ver_cliente?id=5"]);
    expect(httpMock.mock.calls[0]![0]).toMatchObject({
      method: "put",
      data: { rute: "editarCliente", lstTelefonos: [{ id_tipotelefono: "2", telefono: "999" }] },
    });
    expect(entities.lstTelefonos).toEqual([{ id: 9, id_tipotelefono: "2", telefono: "999" }]);
    expect(swalCall()).toMatchObject({ icon: "success", text: "ok" });
  });

  test.each([
    ["a refused save", rejected("No encontramos ese cliente"), "No encontramos ese cliente"],
    ["a connection failure", new Error("network"), CONNECTION_ERROR_MESSAGE],
  ])("actualizarCliente reports %s and keeps the edited lists", async (_, answer, message) => {
    respond({ actualizar_cliente: answer });
    const entities = useEntitiesStore();
    entities.lstTelefonos = [{ id_tipotelefono: "2", telefono: "999" }];

    expect(await entities.actualizarCliente()).toBe(false);

    expect(sentUrls()).toEqual(["actualizar_cliente"]);
    expect(swalCall()).toMatchObject({ icon: "error", text: message });
    expect(entities.lstTelefonos).toEqual([{ id_tipotelefono: "2", telefono: "999" }]);
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

  test("eliminarPersona removes a provider, shows the result and leaves the list to the caller", async () => {
    respond({ eliminar_proveedor: accepted([]) });
    const entities = useEntitiesStore();
    entities.lstProveedor = [{ id: 7 }];

    await entities.eliminarPersona({ id: 3 });
    await flushPromises();

    expect(sentUrls()).toEqual(["eliminar_proveedor"]);
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "put", data: { id: 3 } });
    expect(swalCall()).toMatchObject({ icon: "success", text: "ok" });
    expect(entities.lstProveedor).toEqual([{ id: 7 }]);
  });

  test("eliminarPersona removes a client through the client route", async () => {
    respond({ eliminar_cliente: accepted([]) });

    await useEntitiesStore().eliminarPersona({ id: 3 }, true);

    expect(sentUrls()).toEqual(["eliminar_cliente"]);
  });

  test.each([
    ["guardarCliente", "registrar_cliente"],
    ["actualizarCliente", "actualizar_cliente"],
    ["guardarProveedor", "registrar_proveedor"],
    ["actualizarProveedor", "actualizar_proveedor"],
  ] as const)("%s sends saved emails and new ones that are kept and filled in", async (action, path) => {
    respond({ [path]: accepted([{ id_entitie: 1 }]), ver_cliente: rejected() });
    const entities = useEntitiesStore();
    entities.lstEmails = [
      { id: 4, description: "Quitado guardado", email: "viejo@x.com", estado: false },
      { id: null, description: "Nuevo", email: "nuevo@x.com", estado: true },
      { id: null, description: "Quitado nuevo", email: "quitado@x.com", estado: false },
      { id: null, description: "Vacio", email: "  ", estado: true },
    ];

    await entities[action]();

    expect(httpMock.mock.calls[0]![0].data).toMatchObject({
      lstEmails: [
        { id: 4, email: "viejo@x.com", estado: false },
        { id: null, email: "nuevo@x.com", estado: true },
      ],
    });
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

  test("exportListClientes posts the client filter and downloads the workbook it receives", async () => {
    URL.createObjectURL = vi.fn(() => "blob:sheet");
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    postMock.mockResolvedValue({ data: new Blob(["xlsx"]) });
    const entities = useEntitiesStore();
    Object.assign(entities.filtro, { correlativo: null, nombrecompleto: "Ana", status: 3, id_tipoproveedor: 4 });

    await entities.exportListClientes();

    const [url, body, config] = postMock.mock.calls[0]!;
    expect(url).toBe(URL_MAIN + "export_list_cliente");
    expect(body).toEqual({
      correlativo: "",
      nombrecompleto: "Ana",
      id_document: "",
      nro_documento: "",
      id_pais: "",
      id_state: "",
      status: "",
    });
    expect(config).toMatchObject({ responseType: "blob" });
    expect(click).toHaveBeenCalledTimes(1);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("exportListProveedor posts the provider filter with document and product", async () => {
    URL.createObjectURL = vi.fn(() => "blob:sheet");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    postMock.mockResolvedValue({ data: new Blob(["xlsx"]) });
    const entities = useEntitiesStore();
    Object.assign(entities.filtro, { bussiness_name: "ACME", nro_documento: "2055", producto: "Café", id_tipoproveedor: 4 });

    await entities.exportListProveedor();

    expect(postMock.mock.calls[0]![0]).toBe(URL_MAIN + "export_list_proveedor");
    expect(postMock.mock.calls[0]![1]).toEqual({
      correlativo: "",
      bussiness_name: "ACME",
      id_document: "",
      nro_documento: "2055",
      id_tipoproveedor: 4,
      producto: "Café",
      id_pais: "",
      id_state: "",
      status: "1",
    });
  });

  test.each([
    ["the reason the server gives", { response: { data: new Blob([JSON.stringify({ mensaje: "Revisa el correlativo" })]) } }, "Revisa el correlativo"],
    ["the connection message when there is no answer", new Error("network"), CONNECTION_ERROR_MESSAGE],
  ])("a failed export shows %s", async (_, failure, message) => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    postMock.mockRejectedValue(failure);

    await useEntitiesStore().exportListClientes();

    expect(click).not.toHaveBeenCalled();
    expect(swalCall()).toMatchObject({ icon: "error", text: message });
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

  test("validarClienteTieneMovimientos returns the check, or a connection failure when the request fails", async () => {
    respond({ "entities/validar_eliminar_cliente": { ...rejected("Tiene casas"), tipomensaje: "warning" } });
    const entities = useEntitiesStore();

    expect(await entities.validarClienteTieneMovimientos({ id: 4 })).toMatchObject({ estadoflag: false, mensaje: "Tiene casas" });
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ params: { id: 4 } });

    respond({ "entities/validar_eliminar_cliente": new Error("network") });
    expect(await entities.validarClienteTieneMovimientos({ id: 4 })).toMatchObject({
      estadoflag: false,
      mensaje: CONNECTION_ERROR_MESSAGE,
    });
  });

  describe("approveClientEdit", () => {
    const hasMovements = { ...rejected("TIENE MOVIMIENTO AFILIADOS"), tipomensaje: "warning" };
    const answerAdminDialog = (usuario: string, clave: string) =>
      vi.mocked(Swal.fire).mockImplementation((async (options: SweetAlertOptions) => {
        document.body.innerHTML = String(options.html);
        (document.getElementById("swal-admin-user") as HTMLInputElement).value = usuario;
        (document.getElementById("swal-admin-password") as HTMLInputElement).value = clave;
        return { isConfirmed: Boolean(await options.preConfirm!(undefined)) };
      }) as never);

    test("approves a client without movements without asking anyone", async () => {
      respond({ "entities/validar_eliminar_cliente": accepted([]) });

      expect(await useEntitiesStore().approveClientEdit(4)).toBe(true);
      expect(Swal.fire).not.toHaveBeenCalled();
    });

    test("approves a client with movements once any administrator confirms, without signing in as that administrator", async () => {
      respond({ "entities/validar_eliminar_cliente": hasMovements, validar_usuario_admin: accepted([{ id: 1 }]) });
      answerAdminDialog("jefa@empresa.com", "clave-admin");

      expect(await useEntitiesStore().approveClientEdit(4)).toBe(true);
      expect(sentUrls()).toEqual(["entities/validar_eliminar_cliente", "validar_usuario_admin"]);
      expect(httpMock.mock.calls[1]![0].data).toEqual({ usuario: "jefa@empresa.com", clave: "clave-admin" });
    });

    test("keeps asking with the reason when the administrator credentials are wrong", async () => {
      respond({
        "entities/validar_eliminar_cliente": hasMovements,
        validar_usuario_admin: rejected("Usuario o contraseña incorrectos"),
      });
      answerAdminDialog("jefa@empresa.com", "mala");

      expect(await useEntitiesStore().approveClientEdit(4)).toBe(false);
      expect(Swal.showValidationMessage).toHaveBeenCalledWith("Usuario o contraseña incorrectos");
    });

    test("does not ask for an administrator when the client cannot be checked", async () => {
      respond({ "entities/validar_eliminar_cliente": new Error("network") });

      expect(await useEntitiesStore().approveClientEdit(4)).toBe(false);
      expect(swalCall()).toMatchObject({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
    });

    test("denies the edit when the dialog is cancelled", async () => {
      respond({ "entities/validar_eliminar_cliente": hasMovements });
      vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

      expect(await useEntitiesStore().approveClientEdit(4)).toBe(false);
    });
  });

  test("validarNombreCliente looks up the matches and keeps them, or none when rejected", async () => {
    respond({ validar_nombre_cliente: accepted([{ id: 1, nombrecompleto: "Ana" }]) });
    const entities = useEntitiesStore();
    entities.cliente.nombrecompleto = "Ana";

    await entities.validarNombreCliente();

    expect(sentUrls()).toEqual(["validar_nombre_cliente?id_branch=7&nombre=Ana"]);
    expect(entities.lstProveedores_x_nombre).toEqual([{ id: 1, nombrecompleto: "Ana" }]);

    respond({ validar_nombre_cliente: rejected() });
    await entities.validarNombreCliente();
    expect(entities.lstProveedores_x_nombre).toEqual([]);
  });

  test.each([
    ["validarDocumentoCliente", "validar_documento_cliente", { id_tipodocumento: 1, nro_documento: "R&D #7" }, "lstProveedores_x_documento"],
    ["validarNombreProveedor", "validar_nombre_proveedor", { nombre: "Ana & Hijos #2" }, "lstProveedores_x_nombre"],
    ["validarDocumentoProveedor", "validar_documento_proveedor", { id_tipodocumento: 3, nro_documento: "55&x=1" }, "lstProveedores_x_documento"],
  ] as const)("%s sends what was typed intact and keeps the matches, or none when rejected", async (action, path, params, list) => {
    respond({ [path]: accepted([{ id: 1, nombrecompleto: "Ana" }]) });
    const entities = useEntitiesStore();
    Object.assign(entities.cliente, { id_tipodocumento: 1, nro_documento: "R&D #7" });
    Object.assign(entities.proveedor, { nombrecompleto: "Ana & Hijos #2", id_tipodocumento: 3, nro_documento: "55&x=1" });

    await entities[action]();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + path, params });
    expect(entities[list]).toEqual([{ id: 1, nombrecompleto: "Ana" }]);

    respond({ [path]: rejected() });
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
