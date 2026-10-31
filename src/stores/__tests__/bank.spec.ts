import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useBankStore } from "@/stores/bank";
import { downloadPdf } from "@/utils/pdfDownload";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("@/utils/pdfDownload", () => ({ downloadPdf: vi.fn(async () => true) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn(), showLoading: vi.fn() } }));

const defaults = "listar_bank?id_branch=7&code=&name=&acronym=&description=&status=1";
const filtro = { name: "", code: "", acronym: "", description: "", status: 1 };

describe("bank store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, logo: "logo.png" }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "open").mockImplementation(() => null);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("fetchDataBank clears loading before the request, encodes the filters and sets loading once the rows land", async () => {
    const bank = useBankStore();
    bank.loading = true;
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = bank.loading;
      return { data: { ...accepted([{ id: 1, name: "BCP" }]), token: "tok-b" } };
    });

    await bank.fetchDataBank({ code: "A B", name: "ñ", acronym: "", description: "x&y", status: 0 });

    expect(loadingDuringRequest).toBe(false);
    expect(httpMock.mock.calls[0]![0].url).toBe(
      URL_MAIN + "listar_bank?id_branch=7&code=A%20B&name=%C3%B1&acronym=&description=x%26y&status=0",
    );
    expect(bank.list).toEqual([{ id: 1, name: "BCP" }]);
    expect(bank.loading).toBe(true);
    expect(sessionStorage.getItem("auth-token")).toBe("tok-b");
  });

  test("fetchDataBank empties the list and only a 401 shows the notice and sends the user to Login", async () => {
    vi.useFakeTimers();
    const bank = useBankStore();
    bank.list = [{ id: 9 }];

    respond({ listar_bank: rejected("Sin bancos") });
    await bank.fetchDataBank(filtro);
    expect(bank.list).toEqual([]);
    expect(bank.loading).toBe(true);
    expect(Swal.fire).not.toHaveBeenCalled();

    respond({ listar_bank: rejected("Token vencido", "401") });
    await bank.fetchDataBank(filtro);
    await flushPromises();
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("fetchDataBank leaves loading false and keeps the list when the request fails", async () => {
    respond({ listar_bank: new Error("network") });
    const bank = useBankStore();
    bank.list = [{ id: 9 }];

    await bank.fetchDataBank(filtro);

    expect(bank.list).toEqual([{ id: 9 }]);
    expect(bank.loading).toBe(false);
  });

  test.each([
    ["insertBank", "insertar_bank"],
    ["updateBank", "actualizar_bank"],
    ["guardarCuentaDetalle", "insertar_cuenta"],
    ["eliminarCuentaDetalle", "eliminar_cuenta"],
  ] as const)("%s shows the answer and reloads the bank list with the default filter", async (name, path) => {
    respond({ [path]: accepted([]), listar_bank: accepted([{ id: 1 }]) });
    const bank = useBankStore();

    await bank[name]({ id: 3 });
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "success",
      text: "ok",
      showCancelButton: false,
      confirmButtonText: "Ok",
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + defaults);
    expect(bank.list).toEqual([{ id: 1 }]);
  });

  test("readBank keeps the first row, or warns when the backend rejects", async () => {
    respond({ ver_bank: accepted([{ id: 2, name: "BBVA" }]) });
    const bank = useBankStore();

    await bank.readBank(2);
    expect(bank.record).toEqual({ id: 2, name: "BBVA" });

    respond({ ver_bank: rejected("No existe") });
    await bank.readBank(3);
    expect(bank.record).toEqual({ id: 2, name: "BBVA" });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No existe" });
  });

  test("getBanksListCargar posts the branch and keeps or empties the list", async () => {
    respond({ "getBanksList/": accepted([{ id: 1 }]) });
    const bank = useBankStore();

    await bank.getBanksListCargar();
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "post", data: { id_branch: 7 } });
    expect(bank.list).toEqual([{ id: 1 }]);

    respond({ "getBanksList/": rejected() });
    await bank.getBanksListCargar();
    expect(bank.list).toEqual([]);
  });

  test.each([
    ["verPagoRealizado", "ver_pago"],
    ["verCobroRealizado", "ver_cobro"],
  ] as const)("%s keeps the first row, and clears the record and goes back when rejected", async (name, path) => {
    respond({ [path]: accepted([{ id: 5 }]) });
    const bank = useBankStore();

    await bank[name]("OP-1");
    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + `${path}?nro_operacion=OP-1&id_branch=7`);
    expect(bank.record).toEqual({ id: 5 });

    respond({ [path]: rejected("No hay pago") });
    await bank[name]("OP-2");
    await flushPromises();
    expect(bank.record).toEqual({});
    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "warning", text: "No hay pago" });
    expect(router.go).toHaveBeenCalledWith(-1);
  });

  test("anularPagoRealizado, anularCobroRealizado and actualizarPagoRealizado post to their own endpoints and return the answer", async () => {
    respond({
      anular_pago: accepted(["a"]),
      anular_cobro: accepted(["b"]),
      actualizar_cobro: accepted(["c"]),
    });
    const bank = useBankStore();

    expect(await bank.anularPagoRealizado(4)).toEqual(accepted(["a"]));
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "put", data: { id: 4 } });
    expect(await bank.anularCobroRealizado({ id: 5 })).toEqual(accepted(["b"]));
    expect(await bank.actualizarPagoRealizado([{ id: 6 }])).toEqual(accepted(["c"]));
    expect(httpMock.mock.calls[2]![0]).toMatchObject({ url: URL_MAIN + "actualizar_cobro", data: { lstPago: [{ id: 6 }] } });
  });

  test("the returning actions give back null when the request fails", async () => {
    respond({ anular_pago: new Error("network") });
    const bank = useBankStore();

    expect(await bank.anularPagoRealizado(4)).toBeNull();
  });

  test("validateNroOperacion and verVacturas pass their params and return the answer", async () => {
    respond({ validate_nro_operacion_cobro: accepted([1]), ver_facturas: accepted([2]) });
    const bank = useBankStore();

    expect(await bank.validateNroOperacion({ nro: "X" })).toEqual(accepted([1]));
    expect(httpMock.mock.calls[0]![0].params).toEqual({ nro: "X" });
    expect(await bank.verVacturas({ id: 1 })).toEqual(accepted([2]));
  });

  test("getDeudaAProveedorPorSucursal numbers the rows and adds the exchange rate with four decimals", async () => {
    respond({
      deuda_a_proveedor_por_sucursal: accepted([
        { saldo_pendiente_local: 370, saldo_pendiente: 100 },
        { saldo_pendiente_local: 0, saldo_pendiente: 0 },
      ]),
    });
    const bank = useBankStore();

    const res = await bank.getDeudaAProveedorPorSucursal(8);

    expect(httpMock.mock.calls[0]![0].params).toEqual({ id_proveedor: 8, id_branch: 7 });
    expect(res).toEqual(accepted([{ saldo_pendiente_local: 370, saldo_pendiente: 100 }, { saldo_pendiente_local: 0, saldo_pendiente: 0 }]));
    expect(bank.deudaAProveedor).toEqual([
      { saldo_pendiente_local: 370, saldo_pendiente: 100, id: 1, nuevoflag: false, parcialflag: false, montoparcial: 0, saldo: 0, tipocambio: "3.7000" },
      { saldo_pendiente_local: 0, saldo_pendiente: 0, id: 2, nuevoflag: false, parcialflag: false, montoparcial: 0, saldo: 0, tipocambio: "1.0000" },
    ]);
  });

  test("getDeudaDeClientePorSucursal numbers the rows without an exchange rate", async () => {
    respond({ deuda_de_cliente_por_sucursal: accepted([{ monto: 5 }]) });
    const bank = useBankStore();

    await bank.getDeudaDeClientePorSucursal(9);

    expect(bank.deudaACliente).toEqual([{ monto: 5, id: 1, nuevoflag: false, parcialflag: false, montoparcial: 0, saldo: 0 }]);
  });

  test.each([
    ["getDeudaAProveedorPorSucursal", "deuda_a_proveedor_por_sucursal", "deudaAProveedor"],
    ["getDeudaDeClientePorSucursal", "deuda_de_cliente_por_sucursal", "deudaACliente"],
  ] as const)("%s empties its list and warns when the backend rejects", async (name, path, state) => {
    respond({ [path]: rejected("Sin deuda") });
    const bank = useBankStore();
    bank[state] = [{ id: 1 }] as never;

    const res = await bank[name](1);

    expect(bank[state]).toEqual([]);
    expect(res).toEqual(rejected("Sin deuda"));
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "Sin deuda" });
  });

  test.each([
    ["setRegistroEgresos", "registro_egresos", "imprimir_registro_egreso", { v_id: 31 }, 31, "listBankCxP"],
    ["setRegistroIgresos", "registro_ingresos", "imprimir_registro_ingresos", { v_id_pago: 41 }, 41, "listBankCxC"],
  ] as const)("%s opens the list once the saved notice closes, printing the voucher first only when chosen", async (name, path, print, row, id, list) => {
    respond({ [path]: accepted([row]) });
    const bank = useBankStore();

    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: false, isDismissed: true } as never);
    expect(await bank[name]({ monto: 10 })).toBe(true);
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "post", data: { monto: 10 } });
    expect(downloadPdf).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith({ name: list });

    vi.mocked(Swal.fire).mockResolvedValueOnce({ isConfirmed: true } as never);
    await bank[name]({ monto: 10 });
    expect(downloadPdf).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + print, params: { id } }, expect.stringContaining(`${id}.pdf`));
    expect(router.push).toHaveBeenCalledTimes(2);
  });

  test.each([
    ["setRegistroEgresos", "registro_egresos"],
    ["setRegistroIgresos", "registro_ingresos"],
    ["updateRegistroEgresos", "actualizar_egresos"],
    ["updateRegistroIgresos", "actualizar_ingresos"],
  ] as const)("%s shows the server's reason when refused and keeps the user on the form", async (name, path) => {
    respond({ [path]: { ...rejected("El monto supera el saldo pendiente."), tipomensaje: "TMSGADV" } });

    expect(await useBankStore()[name]({})).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "El monto supera el saldo pendiente." });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("a payment that never reaches the server says so instead of claiming success", async () => {
    respond({ registro_egresos: new Error("network") });

    expect(await useBankStore().setRegistroEgresos({})).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
    expect(router.push).not.toHaveBeenCalled();
  });

  test.each([
    ["updateRegistroEgresos", "actualizar_egresos", "listBankCxP"],
    ["updateRegistroIgresos", "actualizar_ingresos", "listBankCxC"],
  ] as const)("%s confirms with the server's message and then opens the list", async (name, path, list) => {
    respond({ [path]: { ...accepted([]), mensaje: "Actualizamos el pago N° 7." } });

    expect(await useBankStore()[name]({ id: 1 })).toBe(true);
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "put", data: { id: 1 } });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", text: "Actualizamos el pago N° 7." });
    expect(router.push).toHaveBeenCalledWith({ name: list });
  });

  test.each([
    ["getRegistroEgresos", "listado_egresos"],
    ["getRegistroIngresos", "listado_ingresos"],
  ] as const)("%s sends the filters with the branch and keeps or empties the list", async (name, path) => {
    respond({ [path]: accepted([{ id: 1 }]) });
    const bank = useBankStore();

    await bank[name]({ mes: 2 });
    expect(httpMock.mock.calls[0]![0].params).toEqual({ mes: 2, id_branch: 7 });
    expect(bank.list).toEqual([{ id: 1 }]);

    respond({ [path]: rejected() });
    await bank[name]({});
    expect(bank.list).toEqual([]);
  });

  test.each([
    ["verRegistroIngresos", "ver_registro_ingresos"],
    ["verRegistroEgresos", "ver_registro_egresos"],
  ] as const)("%s returns the first row, or an empty object when rejected", async (name, path) => {
    respond({ [path]: accepted([{ id: 3 }]) });
    const bank = useBankStore();

    expect(await bank[name]({ id: 3 })).toEqual({ id: 3 });
    expect(httpMock.mock.calls[0]![0].params).toEqual({ id: 3, id_branch: 7 });

    respond({ [path]: rejected() });
    expect(await bank[name]({ id: 3 })).toEqual({});
  });

  test.each([
    ["eliminarRegistroIngresos", "eliminar_registro_ingresos"],
    ["eliminarRegistroEgresos", "eliminar_registro_egresos"],
  ] as const)("%s tells the user the server's answer and returns whether it annulled", async (name, path) => {
    respond({ [path]: accepted([]) });
    const bank = useBankStore();

    expect(await bank[name]({ id: 1 })).toBe(true);
    expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "delete", data: { id: 1 } });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });

    vi.mocked(Swal.fire).mockClear();
    respond({ [path]: { ...rejected("No encontramos ese pago en tu empresa."), tipomensaje: "TMSGADV" } });
    expect(await bank[name]({ id: 1 })).toBe(false);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", text: "No encontramos ese pago en tu empresa." });
  });

  test.each([
    ["validarIngresoNroOperacion", "validar_nrooperacion_ingreso"],
    ["validarEgresoNroOperacion", "validar_nrooperacion_egreso"],
  ] as const)("%s returns the data of the answer", async (name, path) => {
    respond({ [path]: accepted([{ existe: true }]) });
    const bank = useBankStore();

    expect(await bank[name]({ nro: "A" })).toEqual([{ existe: true }]);
    expect(httpMock.mock.calls[0]![0].params).toEqual({ nro: "A", id_branch: 7 });
  });

  test.each([
    ["imprimirComprobanteIngreso", "imprimir_registro_ingresos"],
    ["imprimirComprobanteEgreso", "imprimir_registro_egreso"],
  ] as const)("%s downloads the record's voucher from the response", async (name, path) => {
    await useBankStore()[name]({ id: 2 });

    expect(downloadPdf).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + path, params: { id: 2 } }, expect.stringContaining("2.pdf"));
    expect(window.open).not.toHaveBeenCalled();
  });
});
