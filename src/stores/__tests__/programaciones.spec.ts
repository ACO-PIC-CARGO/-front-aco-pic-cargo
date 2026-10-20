import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useProgramacionesStore } from "@/stores/programaciones";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("programaciones store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
    sessionStorage.setItem("iso_pais", JSON.stringify(51));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("ListProgrammedPayment keeps the rows and the token when the backend accepts", async () => {
    respond({ "ListProgrammedPaymentDetails/7": { ...accepted([{ id: 1 }]), token: "tok-p" } });
    const programaciones = useProgramacionesStore();

    await programaciones.ListProgrammedPayment();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "ListProgrammedPaymentDetails/7",
      headers: JSON_HEADERS,
      data: { id_branch: 7 },
    });
    expect(programaciones.listado).toEqual([{ id: 1 }]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok-p");
  });

  test("ListProgrammedPayment empties the list, shows the error and goes to Login on a 401", async () => {
    vi.useFakeTimers();
    respond({ "ListProgrammedPaymentDetails/7": rejected("Token vencido", "401") });
    const programaciones = useProgramacionesStore();
    programaciones.listado = [{ id: 9 }];

    await programaciones.ListProgrammedPayment();
    await flushPromises();

    expect(programaciones.listado).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("ListProgrammedPayment keeps the list when the request fails", async () => {
    respond({ "ListProgrammedPaymentDetails/7": new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const programaciones = useProgramacionesStore();
    programaciones.listado = [{ id: 9 }];

    await programaciones.ListProgrammedPayment();

    expect(programaciones.listado).toEqual([{ id: 9 }]);
  });

  test("GetTotalCotizacion keeps the rows and sends no other request", async () => {
    respond({ cargar_programacion: accepted([{ id: 2 }]) });
    const programaciones = useProgramacionesStore();

    await programaciones.GetTotalCotizacion();

    expect(programaciones.listProgramacion).toEqual([{ id: 2 }]);
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("getListProgramacion defaults a missing exchange rate to 1", async () => {
    respond({ pagos_programados_por_proveedor: accepted([{ id: 1, tipocambio: 0 }, { id: 2, tipocambio: 3.5 }]) });
    const programaciones = useProgramacionesStore();

    await programaciones.getListProgramacion({ id_proveedor: 5, id: 6, id_coins: 2 });

    expect(httpMock.mock.calls[0]![0].url).toBe(
      URL_MAIN + "pagos_programados_por_proveedor?id_branch=7&id_proveedor=5&id_programend=6&id_coins=2",
    );
    expect(programaciones.listProgramacionxProveedor).toEqual([
      { id: 1, tipocambio: 1 },
      { id: 2, tipocambio: 3.5 },
    ]);
  });

  test("setPagoProgramado and eliminarProgramacion reload the list once the user confirms the notice", async () => {
    respond({
      registrar_pagos_programado: accepted([{ mensaje: "Registrado" }]),
      eliminar_programacion: accepted([{ mensaje: "Eliminado" }]),
      "ListProgrammedPaymentDetails/7": accepted([{ id: 1 }]),
    });
    const programaciones = useProgramacionesStore();

    await programaciones.setPagoProgramado({ a: 1 });
    await programaciones.eliminarProgramacion({ id: 3 });
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls.map((c) => c[0])).toEqual([
      { icon: "info", titleText: "Aviso", text: "Registrado" },
      { icon: "info", titleText: "Aviso", text: "Eliminado" },
    ]);
    const reloads = httpMock.mock.calls.filter((c) => c[0].url.endsWith("ListProgrammedPaymentDetails/7"));
    expect(reloads).toHaveLength(2);
    expect(programaciones.listado).toEqual([{ id: 1 }]);
  });

  test("eliminarProgramacionDetalle shows the notice and does not reload the list", async () => {
    respond({ eliminar_programacion_detalle: accepted([{ mensaje: "Quitado" }]) });
    const programaciones = useProgramacionesStore();

    await programaciones.eliminarProgramacionDetalle({ id: 3 });
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", titleText: "Aviso", text: "Quitado" });
    expect(httpMock).toHaveBeenCalledTimes(1);
  });
});
