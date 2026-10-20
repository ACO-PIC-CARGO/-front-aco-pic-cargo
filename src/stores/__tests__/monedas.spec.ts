import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useMonedasStore } from "@/stores/monedas";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn(), dispatch: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("monedas store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test("CargarMoneda keeps the rows the backend accepts", async () => {
    respond({ cargar_moneda: accepted([{ id: 1, code: "USD" }]) });
    const monedas = useMonedasStore();

    await monedas.CargarMoneda();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_moneda",
      headers: JSON_HEADERS,
    });
    expect(monedas.moneda).toEqual([{ id: 1, code: "USD" }]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("CargarMoneda tells the user and keeps the previous rows when the backend rejects", async () => {
    respond({ cargar_moneda: rejected("Sin monedas") });
    const monedas = useMonedasStore();
    monedas.moneda = [{ id: 9, code: "PEN" }] as never;

    await monedas.CargarMoneda();

    expect(monedas.moneda).toEqual([{ id: 9, code: "PEN" }]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", title: "Sin monedas" });
  });

  test("moneda starts empty", () => {
    expect(useMonedasStore().moneda).toBeNull();
  });
});
