import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useItemServicesStore } from "@/stores/itemServices";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const row = { id: 3, id_groupservices: 1, code: "001", name: "FLETE", description: "", status: 1, id_branch: 7 };

describe("itemServices store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("starts on the filter form with the active filter and an empty model status", () => {
    const store = useItemServicesStore();

    expect(store.tipo).toBe("filter");
    expect(store.drawer).toBe(false);
    expect(store.filtros).toEqual({ id: "", id_groupservices: "", code: "", name: "", description: "", id_branch: "", status: 1 });
    expect(store.model.status).toBe("");
  });

  test("GetListItemServices reads the current filters, sends 'Todos' as empty and keeps the rows", async () => {
    respond({ listar_itemservices: accepted([row]) });
    const store = useItemServicesStore();

    await store.GetListItemServices();
    store.filtros = { ...store.filtros, id_groupservices: 1, code: "00", name: "FLE", description: "D", status: "null" };
    await store.GetListItemServices();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "get",
      url: URL_MAIN + "listar_itemservices?&id_branch=7&id_groupservices=&code=&name=&description=&status=1",
      headers: JSON_HEADERS,
    });
    expect(httpMock.mock.calls[1]![0].url).toBe(
      URL_MAIN + "listar_itemservices?&id_branch=7&id_groupservices=1&code=00&name=FLE&description=D&status=",
    );
    expect(store.lstItemServices).toEqual([row]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("GetListItemServices empties the list and tells the user when the backend rejects", async () => {
    respond({ listar_itemservices: rejected() });
    const store = useItemServicesStore();
    store.lstItemServices = [row];

    await store.GetListItemServices();

    expect(store.lstItemServices).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("setItemServices posts and ActualizarItemServices puts the current model, each showing the answer", async () => {
    respond({ insertar_itemservices: accepted([]), actualizar_itemservices: rejected("Duplicado") });
    const store = useItemServicesStore();
    store.model = row;

    await store.setItemServices();
    await store.ActualizarItemServices();

    expect(httpMock).toHaveBeenNthCalledWith(1, { method: "post", url: URL_MAIN + "insertar_itemservices", headers: JSON_HEADERS, data: row });
    expect(httpMock).toHaveBeenNthCalledWith(2, { method: "put", url: URL_MAIN + "actualizar_itemservices", headers: JSON_HEADERS, data: row });
    expect(Swal.fire).toHaveBeenNthCalledWith(1, { icon: "success", text: "ok" });
    expect(Swal.fire).toHaveBeenNthCalledWith(2, { icon: "error", text: "Duplicado" });
  });
});
