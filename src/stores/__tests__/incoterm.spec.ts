import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import { useIncotermStore } from "@/stores/incoterm";
import { usePricingStore } from "@/stores/pricing";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("@/store", () => ({ default: { commit: vi.fn() } }));

const fob = { id: 3, name: "FOB", description: "FREE ON BOARD", status: 1 };
const defaultList = URL_MAIN + "listar_incoterms?id_branch=7&name=&description=&status=1";
const aduanaCopy = () => toRaw(useAduanaStore().listIncoterms);

describe("incoterm store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("fetchDataIncoterms lists with the encoded filters, marks the list loaded and hands the same rows to pricing and aduana", async () => {
    const incoterm = useIncotermStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = incoterm.loading;
      return { data: accepted([fob]) };
    });
    incoterm.loading = true;

    await incoterm.fetchDataIncoterms({ name: "F O", description: "a/b", status: "" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_incoterms?id_branch=7&name=F%20O&description=a%2Fb&status=",
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(incoterm.list).toEqual([fob]);
    expect(incoterm.loading).toBe(true);
    expect(aduanaCopy()).toBe(toRaw(incoterm.list));
    expect(toRaw(usePricingStore().listIncoterms)).toBe(toRaw(incoterm.list));
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
  });

  test("fetchDataIncoterms empties the shared list and tells the user when the backend rejects", async () => {
    respond({ listar_incoterms: rejected() });
    const incoterm = useIncotermStore();
    incoterm.list = [fob];

    await incoterm.fetchDataIncoterms({ name: "", description: "", status: 1 });

    expect(incoterm.list).toEqual([]);
    expect(aduanaCopy()).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "info", text: "No se encontraron registros" });
  });

  test("CargarIncotermsConfig loads the configured incoterms into the shared list, empty on rejection, untouched on failure", async () => {
    respond({ ver_incoterms_config: accepted([fob]) });
    const incoterm = useIncotermStore();

    await incoterm.CargarIncotermsConfig();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "ver_incoterms_config",
      headers: JSON_HEADERS,
      params: { id_branch: 7 },
    });
    expect(incoterm.list).toEqual([fob]);
    expect(aduanaCopy()).toBe(toRaw(incoterm.list));
    expect(toRaw(usePricingStore().listIncoterms)).toBe(toRaw(incoterm.list));
    expect(incoterm.loading).toBe(false);

    respond({ ver_incoterms_config: rejected() });
    await incoterm.CargarIncotermsConfig();
    expect(incoterm.list).toEqual([]);
    expect(aduanaCopy()).toEqual([]);

    vi.spyOn(console, "error").mockImplementation(() => {});
    incoterm.list = [fob];
    respond({ ver_incoterms_config: new Error("network") });
    await incoterm.CargarIncotermsConfig();
    expect(incoterm.list).toEqual([fob]);
    expect(aduanaCopy()).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("insertIncoterms posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_incoterms: accepted([]), listar_incoterms: accepted([fob]) });
    const incoterm = useIncotermStore();

    await incoterm.insertIncoterms({ name: "FOB", status: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_incoterms",
      headers: JSON_HEADERS,
      data: { name: "FOB", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("updateIncoterms puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_incoterms: rejected("Duplicado"), listar_incoterms: accepted([]) });
    const incoterm = useIncotermStore();

    await incoterm.updateIncoterms({ id: 3, description: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_incoterms",
      headers: JSON_HEADERS,
      data: { id: 3, description: "X" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0].url).toBe(defaultList);
  });

  test("readIncoterms keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_incoterms: accepted([fob]) });
    const incoterm = useIncotermStore();

    await incoterm.readIncoterms(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_incoterms?id=3", headers: JSON_HEADERS });
    expect(incoterm.record).toEqual(fob);

    respond({ ver_incoterms: rejected("No existe") });
    await incoterm.readIncoterms(9);
    expect(incoterm.record).toEqual(fob);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});
