import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useProveedorStore } from "@/stores/proveedor";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const naviera = { id: 3, namelong: "Naviera Uno" };

describe("proveedor store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("obtenerProveedorPricing stamps the branch on the filter, sends it as params and keeps the rows", async () => {
    respond({ cargar_proveedor_pricing: accepted([naviera]) });
    const store = useProveedorStore();

    await store.obtenerProveedorPricing({ id: "3,4", search: null });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "cargar_proveedor_pricing",
      headers: JSON_HEADERS,
      params: { id: "3,4", search: null, id_branch: 7 },
    });
    expect(store.lstProveedores).toEqual([naviera]);
  });

  test("obtenerProveedorPricing empties the list and shows the error when the backend rejects", async () => {
    respond({ cargar_proveedor_pricing: rejected("Sin proveedores") });
    const store = useProveedorStore();
    store.lstProveedores = [naviera];

    await store.obtenerProveedorPricing({ id: "" });

    expect(store.lstProveedores).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "error",
      text: "Sin proveedores",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("obtenerProveedorPricing sends the user to Login when the session expired", async () => {
    vi.useFakeTimers();
    respond({ cargar_proveedor_pricing: rejected("Token vencido", "401") });
    const store = useProveedorStore();

    await store.obtenerProveedorPricing({ id: "" });
    await flushPromises();

    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("obtenerProveedorPricing keeps the list when the request fails", async () => {
    respond({ cargar_proveedor_pricing: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useProveedorStore();
    store.lstProveedores = [naviera];

    await store.obtenerProveedorPricing({ id: "" });

    expect(store.lstProveedores).toEqual([naviera]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("obtenerProveedorPricing rejects without a request when the session has no user", async () => {
    sessionStorage.clear();
    const store = useProveedorStore();

    await expect(store.obtenerProveedorPricing({ id: "" })).rejects.toThrow();
    expect(httpMock).not.toHaveBeenCalled();
  });
});
