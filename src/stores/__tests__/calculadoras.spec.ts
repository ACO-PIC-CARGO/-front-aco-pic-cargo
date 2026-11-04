import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const sentUrls = () => httpMock.mock.calls.map(([config]) => config.url.slice(URL_MAIN.length));
// The calculator store is untyped for this spec: it drives every action through one shape.
type Calc = Record<string, unknown> & Record<string, (arg?: unknown) => Promise<unknown>>;
const calc = () => useCalculadorasStore() as unknown as Calc;

describe("calculadoras store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, users: "ana" }]));
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 3, id_pais: 139 }]));
    sessionStorage.setItem("iso_pais", "9589");
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("GetTotalCotizacion posts the session country iso and keeps the rows", async () => {
    respond({ get_total_cotizacion: accepted([{ total: 4 }]) });
    const c = calc();

    await c.GetTotalCotizacion!();

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "get_total_cotizacion",
      headers: JSON_HEADERS,
      data: { iso_pais: 9589 },
    });
    expect(c.listTotalCotizacion).toEqual([{ total: 4 }]);
  });

  test("CargarPuertoPorTipoPorPais raises the root overlay while it reads the ports, then returns them", async () => {
    let overlayDuringRequest: unknown;
    httpMock.mockImplementation(async () => {
      overlayDuringRequest = calc().overlay;
      return { data: accepted([{ puerto_descripcion: "CALLAO" }]) };
    });

    const ports = await calc().CargarPuertoPorTipoPorPais!({ id_pais: 139, tipo: "M" });

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "CargarPuertoXPaisXTipo/139/M", headers: JSON_HEADERS });
    expect(overlayDuringRequest).toBe(true);
    expect(calc().overlay).toBe(false);
    expect(ports).toEqual([{ puerto_descripcion: "CALLAO" }]);
  });

  test("CargarPuertoPorTipoPorPais sends the undefined type the callers pass as `type`, and on a rejection returns no ports, shows the message and leaves the overlay up", async () => {
    respond({ "CargarPuertoXPaisXTipo/139/undefined": rejected("Sin puertos") });

    const ports = await calc().CargarPuertoPorTipoPorPais!({ id_pais: 139, type: "M" });

    expect(ports).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", title: "Sin puertos" });
    expect(calc().overlay).toBe(true);
  });

  describe.each([
    ["CargarnavieraCalc", "cargar_navieras", "navieraCalc"],
    ["CargarcontendedorCalc", "cargar_contenedores", "contendedorCalc"],
  ])("%s", (action, path, key) => {
    test("keeps the rows when the backend accepts and lowers the overlay", async () => {
      respond({ [path]: accepted([{ id: 1 }]) });
      const c = calc();

      await c[action]!();

      expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + path, headers: JSON_HEADERS });
      expect(c[key]).toEqual([{ id: 1 }]);
      expect(calc().overlay).toBe(false);
    });

    test("shows the message, keeps nothing and still lowers the overlay when the backend rejects", async () => {
      respond({ [path]: rejected("Sin datos") });
      const c = calc();

      await c[action]!();

      expect(c[key]).toBeUndefined();
      expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", title: "Sin datos" });
      expect(calc().overlay).toBe(false);
    });
  });

  test("CargarSucursal keeps the branches only when the backend accepts", async () => {
    respond({ cargar_sucursal: rejected() });
    const c = calc();
    await c.CargarSucursal!();
    expect(c.listSucursal).toBeUndefined();

    respond({ cargar_sucursal: accepted([{ paises_id: 1, paises_nombre: "Peru" }]) });
    await c.CargarSucursal!();

    expect(httpMock).toHaveBeenCalledWith({ method: "post", url: URL_MAIN + "cargar_sucursal", headers: JSON_HEADERS });
    expect(c.listSucursal).toEqual([{ paises_id: 1, paises_nombre: "Peru" }]);
  });

  test("getListUserCalc and getCboStatus keep whatever data the backend sends", async () => {
    respond({ listar_usuarios_calculadora: rejected(), cargue_status: accepted([{ id: 2 }]) });
    const c = calc();

    await c.getListUserCalc!();
    await c.getCboStatus!();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "listar_usuarios_calculadora",
      headers: JSON_HEADERS,
      data: { iso_pais: 9589 },
    });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "post", url: URL_MAIN + "cargue_status", headers: JSON_HEADERS });
    expect(c.listUser).toEqual([]);
    expect(c.cboStatus).toEqual([{ id: 2 }]);
  });

  test.each([
    ["TMSGINF", "info"],
    ["TMSGERR", "error"],
  ])("SetCall shows the first row message with the %s icon rule", async (tipomensaje, icon) => {
    respond({ insert_call: accepted([{ tipomensaje, mensaje: "Llamada" }]) });

    await calc().SetCall!({ iduser: 5 });

    expect(httpMock).toHaveBeenCalledWith({ method: "post", url: URL_MAIN + "insert_call", headers: JSON_HEADERS, data: { iduser: 5 } });
    expect(Swal.fire).toHaveBeenCalledWith({ icon, title: "Llamada" });
  });

  test.each([
    ["GetCotFCL", "get_cot_fcl", "datos"],
    ["GetCotLCL", "get_cot_lcl", "datos"],
    ["GetCotAereo", "get_cot_aereo", "datos"],
    ["GetCotFCLResumen", "get_cot_fcl_resumen", "datosresumen"],
    ["GetCotLCLResumen", "get_cot_lcl_resumen", "datosresumen"],
    ["GetCotAereoResumen", "get_cot_aereo_resumen", "datosresumen"],
  ])("%s reads the quote by token into %s", async (action, path, key) => {
    respond({ [path]: rejected() });
    const c = calc();
    expect(c[key]).toBeNull();

    await c[action]!("tk1");

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + path + "?token=tk1", headers: JSON_HEADERS });
    expect(c[key]).toEqual([]);
  });

  test("GetTipoCosto and GetCalcMultiplicador stamp the branch country and id on the caller's filter, and GetCalcServicio sends its own", async () => {
    respond({
      "calc/tipo_costo": accepted([{ id: "2", nombre: "DESTINO" }]),
      "calc/servicio": rejected(),
      "calc/multiplicador": accepted([{ id: 9, name: "40 HC" }]),
    });
    const filtro: Record<string, unknown> = { shimpent: "FCL", id_modality: 1 };
    const c = calc();

    await c.GetTipoCosto!(filtro);
    expect(filtro).toEqual({ shimpent: "FCL", id_modality: 1, id_pais: 139 });
    await c.GetCalcServicio!();
    await c.GetCalcMultiplicador!(filtro);

    expect(filtro).toEqual({ shimpent: "FCL", id_modality: 1, id_pais: 139, id_branch: 3 });
    expect(httpMock.mock.calls[0]![0]).toEqual({ method: "get", url: URL_MAIN + "calc/tipo_costo", headers: JSON_HEADERS, params: filtro });
    expect(httpMock.mock.calls[1]![0]).toEqual({ method: "get", url: URL_MAIN + "calc/servicio", headers: JSON_HEADERS, params: { id_pais: 139 } });
    expect(httpMock.mock.calls[2]![0].params).toBe(filtro);
    expect(c.lstTipoCosto).toEqual([{ id: "2", nombre: "DESTINO" }]);
    expect(c.lstServicio).toEqual([]);
    expect(c.lstMultiplicador).toEqual([{ id: 9, name: "40 HC" }]);
  });

  test("PostCalcServicio reloads the services only when the backend accepts", async () => {
    respond({ "calc/servicio/guardar": rejected(), "calc/servicio": accepted([{ id: "3" }]) });
    const c = calc();
    await c.PostCalcServicio!({ code: "03" });
    await flushPromises();
    expect(sentUrls()).toEqual(["calc/servicio/guardar"]);

    respond({ "calc/servicio/guardar": accepted([]), "calc/servicio": accepted([{ id: "3" }]) });
    await c.PostCalcServicio!({ code: "03" });
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith({ method: "post", url: URL_MAIN + "calc/servicio/guardar", headers: JSON_HEADERS, data: { code: "03" } });
    expect(sentUrls()).toEqual(["calc/servicio/guardar", "calc/servicio/guardar", "calc/servicio"]);
    expect(c.lstServicio).toEqual([{ id: "3" }]);
  });

  test("PostCalcCosto stamps the country and user, then reloads the costs locked for editing", async () => {
    respond({ "calc/costos/insertar": accepted([]), "calc/costos": accepted([{ id: "1", punitario: "90.00" }]) });
    const costo: Record<string, unknown> = { concepto: "Visto Bueno" };
    const c = calc();

    await c.PostCalcCosto!(costo);
    await flushPromises();

    expect(costo).toEqual({ concepto: "Visto Bueno", id_pais: 139, users: "ana" });
    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "calc/costos/insertar", headers: JSON_HEADERS, data: costo });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "get", url: URL_MAIN + "calc/costos", headers: JSON_HEADERS, params: { id_pais: 139 } });
    expect(c.lstCostos).toEqual([{ id: "1", punitario: "90.00", bloqueadoflag: true }]);
  });

  test("PostCalcCosto does not reload the costs when the backend rejects", async () => {
    respond({ "calc/costos/insertar": rejected() });

    await calc().PostCalcCosto!({});
    await flushPromises();

    expect(sentUrls()).toEqual(["calc/costos/insertar"]);
  });

  test("GetCotValLCL wraps the rows for validation and returns every validated row with its own verdict", async () => {
    const checked = [
      { estadoflag: false, mensaje: "Fila 2: falta la moneda.", puerto_origen: "NINGBO" },
      { estadoflag: true, mensaje: null, puerto_origen: "XIAMEN" },
    ];
    respond({ "calc/val_data_lcl": { ...rejected("Fila 2: falta la moneda."), data: checked } });

    expect(await calc().GetCotValLCL!([{ puerto_origen: "NINGBO" }])).toEqual(checked);
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "calc/val_data_lcl",
      headers: JSON_HEADERS,
      data: { data: [{ puerto_origen: "NINGBO" }] },
    });
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("GetCotValLCL shows why nothing could be validated and returns no rows", async () => {
    respond({ "calc/val_data_lcl": new Error("Network Error") });

    expect(await calc().GetCotValLCL!([{ puerto_origen: "NINGBO" }])).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", title: "No pudimos validar el archivo", text: CONNECTION_ERROR_MESSAGE });
  });

  test("postGuardarCostos stamps the user but no branch, confirms and reloads the page", async () => {
    respond({ "calc/costos_calc": accepted([{ ok: 1 }]) });
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    const datos: Record<string, unknown> = { shipment: "LCL", costos: [] };

    expect(await calc().postGuardarCostos!(datos)).toBe(true);
    await flushPromises();

    expect(datos).toEqual({ shipment: "LCL", costos: [], user: "ana" });
    expect(httpMock).toHaveBeenCalledWith({ method: "post", url: URL_MAIN + "calc/costos_calc", headers: JSON_HEADERS, data: datos });
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "success",
      title: "Registro Correcto",
      allowEnterKey: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test("postGuardarCostos shows why the batch was refused and does not reload when the message is dismissed", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { reload });
    respond({ "calc/costos_calc": rejected("No guardamos ninguna tarifa. Fila 3: falta la moneda.") });
    expect(await calc().postGuardarCostos!({})).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "No se guardaron los cambios",
      text: "No guardamos ninguna tarifa. Fila 3: falta la moneda.",
    });
    vi.mocked(Swal.fire).mockClear();

    respond({ "calc/costos_calc": accepted([]) });
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    await calc().postGuardarCostos!({});
    await flushPromises();
    expect(reload).not.toHaveBeenCalled();
  });

  describe.each([
    ["getCostosList", "calc/costos_list", "lstFlete"],
    ["getProfitList", "calc/profit_list", "lstProfit"],
    ["getDepartamentos", "calc/departamentos", "lstDepartamentos"],
    ["getDistritos", "calc/distritos", "lstDistritos"],
    ["getCiudad", "calc/ciudades", "lstCiudades"],
    ["getFleteGrupal", "calc/flete/grupal", "lstFleteGrupal"],
    ["getFleteGrupalResumen", "calc/flete/grupal/resumen", "lstFleteGrupalResumen"],
    ["getFleteGrupalVenta", "calc/flete/grupal_venta", "lstFleteGrupalVenta"],
  ])("%s", (action, path, key) => {
    test("stamps the branch country on the caller's filter and keeps the rows when the backend accepts", async () => {
      respond({ [path]: accepted([{ id: "1", valor: "170.0000" }]) });
      const filtro: Record<string, unknown> = { shimpent: "LCL", id_modality: 1 };
      const c = calc();

      await c[action]!(filtro);

      expect(filtro).toEqual({ shimpent: "LCL", id_modality: 1, id_pais: 139 });
      expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + path, headers: JSON_HEADERS, params: filtro });
      expect(c[key]).toEqual([{ id: "1", valor: "170.0000" }]);
    });

    test("keeps the previous rows when the backend rejects", async () => {
      respond({ [path]: accepted([{ id: "1" }]) });
      const c = calc();
      await c[action]!({});
      respond({ [path]: rejected() });

      await c[action]!({});

      expect(c[key]).toEqual([{ id: "1" }]);
    });

    test("writes whatever list an accepted answer carries, even null", async () => {
      respond({ [path]: accepted([{ id: "1" }]) });
      const c = calc();
      await c[action]!({});
      respond({ [path]: accepted(null) });

      await c[action]!({});

      expect(c[key]).toBeNull();
    });
  });

  test("getFleteGrupalResumen throws before any request when it gets no filter", async () => {
    await expect(calc().getFleteGrupalResumen!()).rejects.toThrow(TypeError);
    expect(httpMock).not.toHaveBeenCalled();
  });

  describe.each([
    ["postGuardarProfit", "post", "calc/profit"],
    ["actualizarGuardarProfit", "put", "calc/profit/actualizar"],
    ["eliminarGuardarProfit", "put", "calc/profit/anular"],
  ])("%s", (action, method, path) => {
    test("stamps the user and country, confirms and returns the rows when the backend accepts", async () => {
      respond({ [path]: accepted([{ id: "6", profit: "200.00" }]) });
      const profit: Record<string, unknown> = { profit: 200, opcion: 1 };

      const rows = await calc()[action]!(profit);

      expect(profit).toEqual({ profit: 200, opcion: 1, user: "ana", id_pais: 139 });
      expect(httpMock).toHaveBeenCalledWith({ method, url: URL_MAIN + path, headers: JSON_HEADERS, data: profit });
      expect(rows).toEqual([{ id: "6", profit: "200.00" }]);
      expect(Swal.fire).toHaveBeenCalledWith({
        icon: "success",
        title: "Registro Correcto",
        allowEnterKey: true,
        allowOutsideClick: true,
        allowEscapeKey: true,
      });
    });

    test("returns no rows and stays silent when the backend rejects", async () => {
      respond({ [path]: rejected() });

      expect(await calc()[action]!({})).toEqual([]);
      expect(Swal.fire).not.toHaveBeenCalled();
    });
  });

  test("ActualizarCosto stamps the user, shows the backend message and reloads the costs once confirmed", async () => {
    respond({ "calc/costo/actualizar": accepted([]), "calc/costos": accepted([]) });
    const costo: Record<string, unknown> = { id: "1", punitario: 95 };

    await calc().ActualizarCosto!(costo);
    await flushPromises();

    expect(costo).toEqual({ id: "1", punitario: 95, user: "ana" });
    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "put", url: URL_MAIN + "calc/costo/actualizar", headers: JSON_HEADERS, data: costo });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "ok", allowEnterKey: true, allowOutsideClick: true, allowEscapeKey: true });
    expect(sentUrls()).toEqual(["calc/costo/actualizar", "calc/costos"]);
  });

  test("ActualizarCosto does not reload when the message is dismissed, and EliminarCosto titles the message from the row list", async () => {
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    respond({ "calc/costo/actualizar": accepted([]), "calc/costo/eliminar": accepted([{ mensaje: "x" }]) });
    const c = calc();

    await c.ActualizarCosto!({});
    await c.EliminarCosto!({ id: "1" });
    await flushPromises();

    expect(sentUrls()).toEqual(["calc/costo/actualizar", "calc/costo/eliminar"]);
    expect(httpMock).toHaveBeenNthCalledWith(2, {
      method: "put",
      url: URL_MAIN + "calc/costo/eliminar",
      headers: JSON_HEADERS,
      data: { id: "1", user: "ana" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[1]![0]).toEqual({
      icon: "success",
      title: undefined,
      allowEnterKey: true,
      allowOutsideClick: true,
      allowEscapeKey: true,
    });
  });

  test("EliminarCosto reloads the costs once confirmed", async () => {
    respond({ "calc/costo/eliminar": accepted([]), "calc/costos": accepted([]) });

    await calc().EliminarCosto!({});
    await flushPromises();

    expect(sentUrls()).toEqual(["calc/costo/eliminar", "calc/costos"]);
  });

  test("GetCalcMultiplicador keeps the multipliers only when the backend finds some", async () => {
    respond({ "calc/multiplicador": accepted([{ id: 1, name: "PESO" }]) });
    const c = calc();
    await c.GetCalcMultiplicador!({});
    respond({ "calc/multiplicador": { estadoflag: false, mensaje: "No se encontraron registros", tipomensaje: "TMSGINF", data: [{ id: null, name: null }] } });
    await c.GetCalcMultiplicador!({});

    expect(c.lstMultiplicador).toEqual([]);
  });

  test("getOpciones keeps the options only when the backend accepts", async () => {
    respond({ "calc/cargar/opciones": accepted([{ id: "1", nombre: "OPCIÓN INDIVIDUAL" }]) });
    const c = calc();
    await c.getOpciones!();
    respond({ "calc/cargar/opciones": rejected() });
    await c.getOpciones!();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "calc/cargar/opciones", headers: JSON_HEADERS });
    expect(c.opciones).toEqual([{ id: "1", nombre: "OPCIÓN INDIVIDUAL" }]);
  });

  test("getConfiguración sends the filter as the body and keeps the rows closed for editing", async () => {
    respond({ "calc/cargar/config": accepted([{ id: "1", texto: "SUNAT" }]) });
    const c = calc();

    await c["getConfiguración"]!({});
    respond({ "calc/cargar/config": rejected() });
    await c["getConfiguración"]!({});

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "calc/cargar/config", headers: JSON_HEADERS, data: {} });
    expect(c.config).toEqual([{ id: "1", texto: "SUNAT", editarflag: false }]);
  });

  test("ActualizarConfig stamps the user and reloads the configuration without a body once confirmed", async () => {
    respond({ "calc/config/actualizar": accepted([]), "calc/cargar/config": accepted([]) });
    const config: Record<string, unknown> = { id: "1", texto: "nuevo" };

    await calc().ActualizarConfig!(config);
    await flushPromises();

    expect(config).toEqual({ id: "1", texto: "nuevo", user: "ana" });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "ok", allowEnterKey: true, allowOutsideClick: true, allowEscapeKey: true });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "get", url: URL_MAIN + "calc/cargar/config", headers: JSON_HEADERS, data: undefined });
  });

  describe.each([
    ["setFleteGrupal", "post", "calc/flete/grupal/guardar", true],
    ["updateFleteGrupal", "put", "calc/flete/grupal/actualizar", true],
    ["setFleteGrupalVenta", "post", "calc/flete/grupal_venta/guardar", true],
    ["updateFleteGrupalVenta", "put", "calc/flete/grupal_venta/actualizar", true],
    ["actualizarFlete", "put", "calc/flete/actualizar", false],
  ])("%s", (action, method, path, stampsCountry) => {
    test("sends the record, confirms an accepted save and explains a refused one", async () => {
      respond({ [path]: accepted([]) });
      const record: Record<string, unknown> = { volumen: 1 };

      expect(await calc()[action]!(record)).toBe(true);
      respond({ [path]: rejected("Ingresa un valor mayor que 0.") });
      expect(await calc()[action]!({})).toBe(false);

      expect(record).toEqual(stampsCountry ? { volumen: 1, id_pais: 139 } : { volumen: 1 });
      expect(httpMock).toHaveBeenNthCalledWith(1, { method, url: URL_MAIN + path, headers: JSON_HEADERS, data: record });
      expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", title: "ok", allowEnterKey: true, allowOutsideClick: true, allowEscapeKey: true });
      expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", title: "No se guardaron los cambios", text: "Ingresa un valor mayor que 0." });
    });
  });

  test("obtenerFleteCalculadora stamps the user's branch and keeps the first freight row", async () => {
    respond({ "calc/flete/obtener_flete": accepted([{ monto_flete: "120.00" }, { monto_flete: "1" }]) });
    const datos: Record<string, unknown> = { shipment: "LCL", volumen: 1.5 };
    const c = calc();

    await c.obtenerFleteCalculadora!(datos);

    expect(datos).toEqual({ shipment: "LCL", volumen: 1.5, id_branch: 7 });
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "calc/flete/obtener_flete", headers: JSON_HEADERS, params: datos });
    expect(c.fletePricing).toEqual({ monto_flete: "120.00" });
  });

  test("validarTransporte numbers the validated rows from 1 and shows the message, or returns none", async () => {
    respond({ "calc/transporte/validate": accepted([{ distrito: "Callao" }, { distrito: "La punta" }]) });
    const c = calc();

    const rows = await c.validarTransporte!({ datovalidar: [] });

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "calc/transporte/validate",
      headers: JSON_HEADERS,
      data: { datovalidar: [] },
    });
    expect(rows).toEqual([
      { distrito: "Callao", index: 1 },
      { distrito: "La punta", index: 2 },
    ]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "ok", allowEnterKey: true, allowOutsideClick: true, allowEscapeKey: true });

    respond({ "calc/transporte/validate": rejected() });
    expect(await c.validarTransporte!({})).toEqual([]);
  });

  test("setGuardarTransporte adds the branch country to a copy of the batch and numbers the saved rows", async () => {
    respond({ "calc/transporte/guardar": accepted([{ id: "322" }]) });
    const lote: Record<string, unknown> = { shimpent: "LCL", datos: [] };

    const rows = await calc().setGuardarTransporte!(lote);

    expect(lote).toEqual({ shimpent: "LCL", datos: [] });
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "calc/transporte/guardar",
      headers: JSON_HEADERS,
      data: { shimpent: "LCL", datos: [], id_pais: 139 },
    });
    expect(rows).toEqual([{ id: "322", index: 1 }]);

    respond({ "calc/transporte/guardar": rejected() });
    expect(await calc().setGuardarTransporte!({})).toEqual([]);
  });

  describe.each([
    ["EliminarTransporte", "put", "calc/transporte/eliminar"],
    ["ActualizarTransporte", "put", "calc/transporte/actualizar"],
    ["RegistroTransporte", "post", "calc/transporte/registro"],
  ])("%s", (action, method, path) => {
    test("sends the tariff, confirms an accepted change and explains a refused one", async () => {
      respond({ [path]: accepted([]) });
      expect(await calc()[action]!({ id: "322" })).toBe(true);
      respond({ [path]: rejected("No se encontraron registros") });
      expect(await calc()[action]!({ id: "322" })).toBe(false);

      expect(httpMock).toHaveBeenNthCalledWith(1, { method, url: URL_MAIN + path, headers: JSON_HEADERS, data: { id: "322" } });
      expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", title: "Aviso", text: "ok" });
      expect(Swal.fire).toHaveBeenNthCalledWith(2, {
        icon: "error",
        title: "No se guardaron los cambios",
        text: "No se encontraron registros",
      });
    });
  });

  test("actualizarFechaVigencia puts the branch country as destination with the validity", async () => {
    respond({ "calc/actualizar_fecha_flete": accepted([]) });

    await calc().actualizarFechaVigencia!("2026-10-30");

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "calc/actualizar_fecha_flete",
      headers: JSON_HEADERS,
      data: { id_pais_destino: 139, vigencia: "2026-10-30" },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", title: "Aviso", text: "ok" });
  });

  test("EnviarCotizacionCalculadoraAPrincing opens the created quote once confirmed", async () => {
    respond({ "calc/enviar_pricing": accepted([{ id_quote_out: 88 }]) });

    await calc().EnviarCotizacionCalculadoraAPrincing!({ id: "577", individualflag: true, grupalflag: false });
    await flushPromises();

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "calc/enviar_pricing",
      headers: JSON_HEADERS,
      data: { id: "577", individualflag: true, grupalflag: false },
    });
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "success",
      title: "Cotización Creada",
      confirmButtonText: "Ir a la cotización",
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    expect(router.push).toHaveBeenCalledWith({ name: "verQuote", params: { id: 88 } });
  });

  test("EnviarCotizacionCalculadoraAPrincing stays on the list when rejected or dismissed", async () => {
    respond({ "calc/enviar_pricing": rejected() });
    await calc().EnviarCotizacionCalculadoraAPrincing!({});
    expect(Swal.fire).not.toHaveBeenCalled();

    respond({ "calc/enviar_pricing": accepted([{ id_quote_out: 88 }]) });
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);
    await calc().EnviarCotizacionCalculadoraAPrincing!({});
    await flushPromises();
    expect(router.push).not.toHaveBeenCalled();
  });

  test("opcionListado opens every option closed for editing, or empties the list when rejected", async () => {
    respond({ "calc/opcion_listado": accepted([{ id: "2", volumenmax: "10.00" }]) });
    const c = calc();

    await c.opcionListado!();
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "calc/opcion_listado" });
    expect(c.lstOpciones).toEqual([{ id: "2", volumenmax: "10.00", editarflag: false }]);

    respond({ "calc/opcion_listado": rejected() });
    await c.opcionListado!();
    expect(c.lstOpciones).toEqual([]);
  });

  test("opcionActualizar explains a refused update and keeps the edited options on screen", async () => {
    respond({ "calc/opcion_listado": accepted([{ id: "1", volumenmax: "25.00" }]) });
    const c = calc();
    await c.opcionListado!();
    (c.lstOpciones as unknown as { volumenmax: string }[])[0]!.volumenmax = "30";
    respond({ "calc/opcion_actualizar": rejected("El volumen máximo de la opción individual no puede pasar de 15 m³.") });

    expect(await c.opcionActualizar!({ id: "1", volumenmax: "30" })).toBe(false);

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      title: "No se guardaron los cambios",
      text: "El volumen máximo de la opción individual no puede pasar de 15 m³.",
    });
    expect(sentUrls()).toEqual(["calc/opcion_listado", "calc/opcion_actualizar"]);
    expect(c.lstOpciones).toEqual([{ id: "1", volumenmax: "30", editarflag: false }]);
  });

  test("opcionActualizar confirms an accepted update and reloads the options", async () => {
    respond({ "calc/opcion_actualizar": accepted([]), "calc/opcion_listado": accepted([]) });

    expect(await calc().opcionActualizar!({ id: "2" })).toBe(true);
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "put", url: URL_MAIN + "calc/opcion_actualizar", data: { id: "2" } });
    expect(sentUrls()).toEqual(["calc/opcion_actualizar", "calc/opcion_listado"]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });
  });

  test.each([
    ["venta", "calc/flete/grupal_venta/actualizar"],
    ["costo", "calc/flete/grupal/actualizar"],
  ] as const)("removeGroupTariff deactivates a %s tariff through its own endpoint only", async (kind, path) => {
    respond({ [path]: accepted([]) });

    expect(await calc().removeGroupTariff!({ tariff: { id: "11", volumen: "1.0000" }, kind })).toBe(true);

    expect(sentUrls()).toEqual([path]);
    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + path,
      headers: JSON_HEADERS,
      data: { id: "11", volumen: "1.0000", estado: false, id_pais: 139 },
    });
  });

  test("cargarEstatus keeps the statuses, or empties them when rejected", async () => {
    respond({ "calc/estatus": accepted([{ id: "1", name: "PRE COTIZACION" }]) });
    const c = calc();
    await c.cargarEstatus!();
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "calc/estatus" });
    expect(c.estatusCotizacion).toEqual([{ id: "1", name: "PRE COTIZACION" }]);

    respond({ "calc/estatus": rejected() });
    await c.cargarEstatus!();
    expect(c.estatusCotizacion).toEqual([]);
  });

  test("setOpcion logs and selects the option; the calculator starts on option 1", () => {
    const c = calc();
    expect(c.opcionCalculadora).toBe(1);

    c.setOpcion!(2);

    expect(console.log).toHaveBeenCalledWith(2);
    expect(c.opcionCalculadora).toBe(2);
  });
});
