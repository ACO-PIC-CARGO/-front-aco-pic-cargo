import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useTypepaymentStore } from "@/stores/typepayment";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const cash = { id: 3, code: "CON", name: "Contado", description: "", status: true };

describe("typepayment store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("GetListTypePayment reads the current filters, sends empty ones as empty and keeps the rows", async () => {
    respond({ listar_type_payments: accepted([cash]) });
    const store = useTypepaymentStore();

    await store.GetListTypePayment();
    store.filtros = { ...store.filtros, code: "CO", name: "Con", description: "d", status: "" };
    await store.GetListTypePayment();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_type_payments?&id_branch=7&code=&name=&description=&status=true",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(URL_MAIN + "listar_type_payments?&id_branch=7&code=CO&name=Con&description=d&status=");
    expect(store.lstTypePayment).toEqual([cash]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListTypePayment empties the list and shows a warning when the backend rejects", async () => {
    respond({ listar_type_payments: rejected() });
    const store = useTypepaymentStore();
    store.lstTypePayment = [cash];

    await store.GetListTypePayment();

    expect(store.lstTypePayment).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "warning", title: "Aviso", text: "No se encontraron registros" });
  });

  test("GetListTypePayment keeps the list when the request fails", async () => {
    respond({ listar_type_payments: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const store = useTypepaymentStore();
    store.lstTypePayment = [cash];

    await store.GetListTypePayment();

    expect(store.lstTypePayment).toEqual([cash]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("setTypePayment posts and ActualizarTypePayment puts the current model, each showing the answer", async () => {
    respond({ insertar_type_payments: accepted([]), actualizar_type_payments: rejected("Duplicado") });
    const store = useTypepaymentStore();
    store.model = cash;

    await store.setTypePayment();
    await store.ActualizarTypePayment();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_type_payments", headers: JSON_HEADERS, data: cash });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_type_payments", headers: JSON_HEADERS, data: cash });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});
