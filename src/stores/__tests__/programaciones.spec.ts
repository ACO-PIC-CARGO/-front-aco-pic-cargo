import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useProgramacionesStore } from "@/stores/programaciones";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
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

  test("ListProgrammedPayment asks the session API and keeps the rows the backend accepts", async () => {
    respond({ ListProgrammedPayment: accepted([{ id: 1 }]) });
    const programaciones = useProgramacionesStore();

    await programaciones.ListProgrammedPayment();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ListProgrammedPayment", headers: JSON_HEADERS });
    expect(programaciones.listado).toEqual([{ id: 1 }]);
  });

  test("ListProgrammedPayment shows an empty list without an error when there are no programmings", async () => {
    respond({ ListProgrammedPayment: rejected() });
    const programaciones = useProgramacionesStore();
    programaciones.listado = [{ id: 9 }];

    await programaciones.ListProgrammedPayment();

    expect(programaciones.listado).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("ListProgrammedPayment empties the list and shows the server's reason when it refuses", async () => {
    respond({ ListProgrammedPayment: { ...rejected("Tu sesión no es válida."), tipomensaje: "TMSGADV" } });
    const programaciones = useProgramacionesStore();
    programaciones.listado = [{ id: 9 }];

    await programaciones.ListProgrammedPayment();

    expect(programaciones.listado).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Tu sesión no es válida." });
  });

  test("ListProgrammedPayment says it could not connect when the request fails", async () => {
    respond({ ListProgrammedPayment: new Error("network") });
    const programaciones = useProgramacionesStore();
    programaciones.listado = [{ id: 9 }];

    await programaciones.ListProgrammedPayment();

    expect(programaciones.listado).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: expect.stringMatching(/^No pudimos conectar/) });
  });

  test("GetTotalCotizacion keeps the rows and sends no other request", async () => {
    respond({ cargar_programacion: accepted([{ id: 2 }]) });
    const programaciones = useProgramacionesStore();

    await programaciones.GetTotalCotizacion();

    expect(programaciones.listProgramacion).toEqual([{ id: 2 }]);
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "cargar_programacion", headers: JSON_HEADERS });
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("getListProgramacion defaults a missing exchange rate to 1", async () => {
    respond({ pagos_programados_por_proveedor: accepted([{ id: 1, tipocambio: 0 }, { id: 2, tipocambio: 3.5 }]) });
    const programaciones = useProgramacionesStore();

    await programaciones.getListProgramacion({ id_proveedor: 5, id: 6, id_coins: 2 });

    expect(httpMock.mock.calls[0]![0].url).toBe(
      URL_MAIN + "pagos_programados_por_proveedor?id_proveedor=5&id_programend=6&id_coins=2",
    );
    expect(programaciones.listProgramacionxProveedor).toEqual([
      { id: 1, tipocambio: 1 },
      { id: 2, tipocambio: 3.5 },
    ]);
  });

  test("setPagoProgramado and eliminarProgramacion reload the list once the user confirms the notice", async () => {
    respond({
      registrar_pagos_programado: { ...accepted([]), mensaje: "Registrado" },
      eliminar_programacion: { ...accepted([]), mensaje: "Eliminado" },
      ListProgrammedPayment: accepted([{ id: 1 }]),
    });
    const programaciones = useProgramacionesStore();

    await programaciones.setPagoProgramado({ a: 1 });
    await programaciones.eliminarProgramacion({ id: 3 });
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls.map((c) => c[0])).toEqual([
      { icon: "success", titleText: "Aviso", text: "Registrado" },
      { icon: "success", titleText: "Aviso", text: "Eliminado" },
    ]);
    const reloads = httpMock.mock.calls.filter((c) => c[0].url.endsWith("ListProgrammedPayment"));
    expect(reloads).toHaveLength(2);
    expect(programaciones.listado).toEqual([{ id: 1 }]);
  });

  test("a refused payment shows the server's reason and does not reload the list", async () => {
    respond({ registrar_pagos_programado: { ...rejected("El monto a pagar no puede superar la deuda."), tipomensaje: "TMSGADV" } });
    const programaciones = useProgramacionesStore();

    await programaciones.setPagoProgramado({ a: 1 });
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", titleText: "Aviso", text: "El monto a pagar no puede superar la deuda." });
    expect(httpMock).toHaveBeenCalledTimes(1);
  });

  test("eliminarProgramacionDetalle shows the notice and does not reload the list", async () => {
    respond({ eliminar_programacion_detalle: { ...accepted([]), mensaje: "Quitado" } });
    const programaciones = useProgramacionesStore();

    await programaciones.eliminarProgramacionDetalle({ id: 3 });
    await flushPromises();

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", titleText: "Aviso", text: "Quitado" });
    expect(httpMock).toHaveBeenCalledTimes(1);
  });
});
