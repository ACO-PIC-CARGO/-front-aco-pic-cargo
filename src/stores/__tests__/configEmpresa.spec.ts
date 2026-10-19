import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const sentUrls = () => httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length));

describe("configEmpresa store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("actualizarDatoEmpresa puts a copy of the company data with the tax type duplicated as TipoImp and shows the answer", async () => {
    respond({ actualizar_datos_empresa_config: accepted([]) });
    const config = useConfigEmpresaStore();
    config.datoEmpresa.trade_name = "ACME";
    config.datoEmpresa.tipoimpuesto = 3;

    await config.actualizarDatoEmpresa();

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "actualizar_datos_empresa_config",
      headers: JSON_HEADERS,
      data: { ...config.datoEmpresa, TipoImp: 3 },
    });
    expect(config.datoEmpresa).not.toHaveProperty("TipoImp");
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
  });

  test("actualizarDatoEmpresa shows the backend error and keeps the data when the backend rejects", async () => {
    respond({ actualizar_datos_empresa_config: rejected("Impuesto inválido") });

    await useConfigEmpresaStore().actualizarDatoEmpresa();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Impuesto inválido" });
  });

  test("actualizarDatoEmpresa only logs when the request fails", async () => {
    respond({ actualizar_datos_empresa_config: new Error("network") });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await useConfigEmpresaStore().actualizarDatoEmpresa();

    expect(log).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("actualizarDatoAdministrador puts the administrator data and shows the answer", async () => {
    respond({ actualizar_datos_administrador_config: accepted([]) });
    const config = useConfigEmpresaStore();
    config.dataUsuario.names = "Ana";

    await config.actualizarDatoAdministrador();

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "actualizar_datos_administrador_config",
      headers: JSON_HEADERS,
      data: config.dataUsuario,
    });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  test("the provider and client uploads post one chunk with the session branch and stay silent", async () => {
    respond({ actualizar_datos_cm_proveedor: accepted([]), actualizar_datos_cm_cliente: accepted([]) });
    const config = useConfigEmpresaStore();

    await config.actualizarDatoCMProveedor([{ nro_documento: "1" }] as never);
    await config.actualizarDatoCMCliente([{ document: "2" }] as never);

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "actualizar_datos_cm_proveedor",
      headers: JSON_HEADERS,
      data: { id_branch: 7, lstProveedor: [{ nro_documento: "1" }] },
    });
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: "post",
      url: URL_MAIN + "actualizar_datos_cm_cliente",
      headers: JSON_HEADERS,
      data: { id_branch: 7, lstClientes: [{ document: "2" }] },
    });
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("obtenerConfigCostos keeps the cost rows for the modality and shipment", async () => {
    respond({ obtener_config_costos: accepted([{ concepto: "BL", monto: 0 }]) });
    const config = useConfigEmpresaStore();

    await config.obtenerConfigCostos({ id_modality: 2, shipment: "FCL" });

    expect(sentUrls()).toEqual(["obtener_config_costos?id_branch=7&id_modality=2&shipment=FCL"]);
    expect(config.lstCostos).toEqual([{ concepto: "BL", monto: 0 }]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("getMultiplicadorConfig keeps the rows in the shape the selects need and zero for a missing value", async () => {
    respond({
      cargar_multiplicador_config: accepted([
        { id: 1, code: "CNT", name: "Contenedor", valor: 5, extra: "x" },
        { id: 2, code: "BL", name: "BL", valor: null },
      ]),
    });
    const config = useConfigEmpresaStore();

    await config.getMultiplicadorConfig({ id_shipment: 3 });

    expect(sentUrls()).toEqual(["cargar_multiplicador_config?id_shipment=3&id_branch=7"]);
    expect(config.lstMultiplicador).toEqual([
      { id: 1, value: 1, code: "CNT", text: "Contenedor", valor: 5 },
      { id: 2, value: 2, code: "BL", text: "BL", valor: 0 },
    ]);
  });

  test("getMultiplicadorConfig keeps the previous rows and logs when the request fails", async () => {
    respond({ cargar_multiplicador_config: new Error("network") });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = useConfigEmpresaStore();
    config.lstMultiplicador = [{ id: 9, value: 9, code: "X", text: "X", valor: 1 }];

    await config.getMultiplicadorConfig({ id_shipment: 3 });

    expect(config.lstMultiplicador).toHaveLength(1);
    expect(error).toHaveBeenCalled();
  });

  test("getTipoCostosConfig keeps the section rows", async () => {
    respond({ tipo_costo_x_embarque: accepted([{ name: "ORIGEN" }]) });
    const config = useConfigEmpresaStore();

    await config.getTipoCostosConfig({ id_shipment: 3, id_modality: 1 });

    expect(sentUrls()).toEqual(["tipo_costo_x_embarque?id_shipment=3&id_modality=1"]);
    expect(config.listTipoCostos).toEqual([{ name: "ORIGEN" }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("getTipoCostosConfig empties the sections and shows the backend error when the backend rejects", async () => {
    respond({ tipo_costo_x_embarque: rejected("Sin secciones") });
    const config = useConfigEmpresaStore();
    config.listTipoCostos = [{ name: "ORIGEN" }];

    await config.getTipoCostosConfig({ id_shipment: 3, id_modality: 1 });

    expect(config.listTipoCostos).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Sin secciones" });
  });

  test("guardarCostos stamps the session branch on the payload and gives back the backend answer", async () => {
    respond({ guardar_costos_config: accepted([]) });
    const payload = { id_modality: 1, id_shipment: 2, lstCostos: [] };

    const answer = await useConfigEmpresaStore().guardarCostos(payload);

    expect(payload).toHaveProperty("id_branch", 7);
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "guardar_costos_config",
      headers: JSON_HEADERS,
      data: payload,
    });
    expect(answer).toEqual(accepted([]));
  });

  test("guardarCostos logs and rethrows the failure", async () => {
    const failure = new Error("network");
    respond({ guardar_costos_config: failure });
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await expect(useConfigEmpresaStore().guardarCostos({ id_modality: 1, id_shipment: 2, lstCostos: [] })).rejects.toBe(failure);
    expect(log).toHaveBeenCalledWith("Error al guardar costos de configuración:", failure);
  });

  test("OmitirConfiguracionCost and finalizarConfiguracion put the session branch", async () => {
    respond({ omitir_config_cost: accepted([]), finalizar_config: accepted([]) });
    const config = useConfigEmpresaStore();

    await config.OmitirConfiguracionCost();
    await config.finalizarConfiguracion();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "omitir_config_cost",
      headers: JSON_HEADERS,
      data: { id_branch: 7 },
    });
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: "put",
      url: URL_MAIN + "finalizar_config",
      headers: JSON_HEADERS,
      data: { id_branch: 7 },
    });
  });

  test("OmitirConfiguracionCost and finalizarConfiguracion answer false without a request when nobody is signed in", async () => {
    sessionStorage.clear();
    const config = useConfigEmpresaStore();

    expect(await config.OmitirConfiguracionCost()).toBe(false);
    expect(await config.finalizarConfiguracion()).toBe(false);
    expect(httpMock).not.toHaveBeenCalled();
  });

  test("OmitirConfiguracionCost and finalizarConfiguracion only log when the request fails", async () => {
    respond({ omitir_config_cost: new Error("network"), finalizar_config: new Error("network") });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const config = useConfigEmpresaStore();

    await config.OmitirConfiguracionCost();
    await config.finalizarConfiguracion();

    expect(error).toHaveBeenCalledTimes(2);
  });

  test("GuardarConfiguracionEmpresa posts the correlatives with the session branch", async () => {
    respond({ guardar_existe_datos_config: accepted([]) });
    const config = useConfigEmpresaStore();
    config.configEmpresa.correlativopricing = 1;

    await config.GuardarConfiguracionEmpresa();

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "guardar_existe_datos_config",
      headers: JSON_HEADERS,
      data: { correlativopricing: 1, correlativomaster: null, correlativocge: null, id_branch: 7 },
    });
  });
});
