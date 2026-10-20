import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useConsolidacionStore } from "@/stores/consolidacion";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("consolidacion store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("generarConsolidacion posts the rows, saves the token and keeps the answer without a message", async () => {
    respond({ generar_consolidacion: { ...accepted([{ nro_operacion: "1" }]), token: "tok-k" } });
    const consolidacion = useConsolidacionStore();

    await consolidacion.generarConsolidacion([{ nroop: "1" }]);

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "generar_consolidacion",
      headers: JSON_HEADERS,
      data: [{ nroop: "1" }],
    });
    expect(sessionStorage.getItem("auth-token")).toBe("tok-k");
    expect(consolidacion.lstConsolidacion).toEqual([{ nro_operacion: "1" }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("generarConsolidacion keeps the rows of a rejected answer and tells the user", async () => {
    respond({ generar_consolidacion: { ...rejected("Sin coincidencias"), data: [{ nro_operacion: "2" }] } });
    const consolidacion = useConsolidacionStore();

    await consolidacion.generarConsolidacion([]);

    expect(consolidacion.lstConsolidacion).toEqual([{ nro_operacion: "2" }]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "Sin coincidencias" });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("generarConsolidacion sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ generar_consolidacion: rejected("Token vencido", "401") });
    const consolidacion = useConsolidacionStore();

    await consolidacion.generarConsolidacion([]);
    await flushPromises();

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("generarConsolidacion keeps the list when the request fails", async () => {
    respond({ generar_consolidacion: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const consolidacion = useConsolidacionStore();
    consolidacion.lstConsolidacion = [{ nro_operacion: "3" }];

    await consolidacion.generarConsolidacion([]);

    expect(consolidacion.lstConsolidacion).toEqual([{ nro_operacion: "3" }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
