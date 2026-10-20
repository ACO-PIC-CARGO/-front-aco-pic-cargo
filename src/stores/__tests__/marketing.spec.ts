import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useMarketingStore } from "@/stores/marketing";
import { usePricingStore } from "@/stores/pricing";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const web = { id: 3, code: "WEB", name: "Web", description: null, position: 1, status: 1 };
const defaultFilter = { name: "", description: "", position: "", status: 1 };

describe("marketing store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => vi.restoreAllMocks());

  test("fetchDataMarketing sends the filter as params, marks the list loaded and hands the same rows to pricing", async () => {
    const marketing = useMarketingStore();
    let loadingDuringRequest: boolean | undefined;
    httpMock.mockImplementation(async () => {
      loadingDuringRequest = marketing.loading;
      return { data: accepted([web]) };
    });
    marketing.loading = true;
    const filter = { name: "We", description: "", position: 1, status: 1 };

    await marketing.fetchDataMarketing(filter);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "listar_marketing",
      params: filter,
      headers: JSON_HEADERS,
    });
    expect(loadingDuringRequest).toBe(false);
    expect(marketing.list).toEqual([web]);
    expect(marketing.loading).toBe(true);
    expect(usePricingStore().listMarketing).toEqual([web]);
  });

  test("fetchDataMarketing hands pricing a copy of the list sorted by name", async () => {
    const zeta = { ...web, id: 4, name: "zeta" };
    const alfa = { ...web, id: 5, name: "Alfa" };
    respond({ listar_marketing: accepted([zeta, alfa]) });
    const marketing = useMarketingStore();

    await marketing.fetchDataMarketing(defaultFilter);

    expect(marketing.list).toEqual([zeta, alfa]);
    expect(usePricingStore().listMarketing).toEqual([alfa, zeta]);
  });

  test("fetchDataMarketing empties the list and pricing's copy without a message when the backend rejects", async () => {
    respond({ listar_marketing: rejected() });
    const marketing = useMarketingStore();
    marketing.list = [web];

    await marketing.fetchDataMarketing(defaultFilter);

    expect(marketing.list).toEqual([]);
    expect(marketing.loading).toBe(true);
    expect(usePricingStore().listMarketing).toEqual([]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("a failed list request keeps the list and leaves the screen loading", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    respond({ listar_marketing: new Error("network") });
    const marketing = useMarketingStore();
    marketing.list = [web];
    usePricingStore().listMarketing = [web];

    await marketing.fetchDataMarketing(defaultFilter);

    expect(marketing.list).toEqual([web]);
    expect(marketing.loading).toBe(false);
    expect(usePricingStore().listMarketing).toEqual([web]);
  });

  test("insertMarketing posts the record and reloads the unfiltered list once the user closes the message", async () => {
    respond({ insertar_marketing: accepted([]), listar_marketing: accepted([web]) });
    const marketing = useMarketingStore();

    await marketing.insertMarketing({ name: "Web", position: 1 });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "post",
      url: URL_MAIN + "insertar_marketing",
      headers: JSON_HEADERS,
      data: { name: "Web", position: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(httpMock.mock.calls[1]![0]).toMatchObject({ url: URL_MAIN + "listar_marketing", params: defaultFilter });
  });

  test("updateMarketing puts the record, shows the backend error and still reloads the list", async () => {
    respond({ actualizar_marketing: rejected("Duplicado"), listar_marketing: accepted([]) });
    const marketing = useMarketingStore();

    await marketing.updateMarketing({ id: 3, name: "X" });
    await flushPromises();

    expect(httpMock).toHaveBeenNthCalledWith(1, {
      method: "put",
      url: URL_MAIN + "actualizar_marketing",
      headers: JSON_HEADERS,
      data: { id: 3, name: "X" },
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(httpMock.mock.calls[1]![0]).toMatchObject({ params: defaultFilter });
  });

  test("readMarketing keeps the first row as the record, or shows the backend message", async () => {
    respond({ ver_marketing: accepted([web]) });
    const marketing = useMarketingStore();

    await marketing.readMarketing(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "ver_marketing?id=3", headers: JSON_HEADERS });
    expect(marketing.record).toEqual(web);

    respond({ ver_marketing: rejected("No existe") });
    await marketing.readMarketing(9);
    expect(marketing.record).toEqual(web);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test("lastPositionMarketing keeps the first row for the branch and ignores a rejection", async () => {
    respond({ ultima_posicion_marketing: accepted([{ maxposition: 4 }]) });
    const marketing = useMarketingStore();

    await marketing.lastPositionMarketing();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "ultima_posicion_marketing?id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(marketing.last_position).toEqual({ maxposition: 4 });

    respond({ ultima_posicion_marketing: rejected() });
    await marketing.lastPositionMarketing();
    expect(marketing.last_position).toEqual({ maxposition: 4 });
  });

  test("ExportMarketing asks for a blob with the filter and downloads it as an xlsx file", async () => {
    const click = vi.fn();
    const link = { href: "", setAttribute: vi.fn(), click };
    vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(link as unknown as HTMLElement);
    window.URL.createObjectURL = vi.fn(() => "blob:report");
    httpMock.mockResolvedValue({ data: "xlsx" });

    await useMarketingStore().ExportMarketing(defaultFilter);

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "exportar_list_marketing",
      params: defaultFilter,
      responseType: "blob",
      headers: JSON_HEADERS,
    });
    expect(link.href).toBe("blob:report");
    expect(link.setAttribute).toHaveBeenCalledWith("download", expect.stringMatching(/^Reporte Listado Marketing .* \.xlsx$/));
    expect(click).toHaveBeenCalledOnce();
  });
});
