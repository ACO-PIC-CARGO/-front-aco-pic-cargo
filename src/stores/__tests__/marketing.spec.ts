import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useMarketingStore } from "@/stores/marketing";
import { usePricingStore } from "@/stores/pricing";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

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

  test("fetchDataMarketing sends the filter as params, marks the list loaded and leaves pricing's marketing list alone", async () => {
    const marketing = useMarketingStore();
    const pricingList = [{ ...web, id: 9, name: "Inactivo para el filtro" }];
    usePricingStore().listMarketing = pricingList;
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
    expect(usePricingStore().listMarketing).toEqual(pricingList);
  });

  test("fetchDataMarketing empties the list without a message when the backend rejects", async () => {
    respond({ listar_marketing: rejected() });
    const marketing = useMarketingStore();
    marketing.list = [web];

    await marketing.fetchDataMarketing(defaultFilter);

    expect(marketing.list).toEqual([]);
    expect(marketing.loading).toBe(true);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("a failed list request keeps the list and leaves the screen loading", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    respond({ listar_marketing: new Error("network") });
    const marketing = useMarketingStore();
    marketing.list = [web];

    await marketing.fetchDataMarketing(defaultFilter);

    expect(marketing.list).toEqual([web]);
    expect(marketing.loading).toBe(false);
  });

  test("insertMarketing posts the record, shows the answer and reports that it was saved", async () => {
    respond({ insertar_marketing: accepted([]) });

    const saved = await useMarketingStore().insertMarketing({ name: "Web", position: 1 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "insertar_marketing",
      headers: JSON_HEADERS,
      data: { name: "Web", position: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok" });
    expect(saved).toBe(true);
  });

  test("updateMarketing puts the record, shows the backend error and reports that it was not saved", async () => {
    respond({ actualizar_marketing: rejected("Duplicado") });

    const saved = await useMarketingStore().updateMarketing({ id: 3, name: "X" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "actualizar_marketing",
      headers: JSON_HEADERS,
      data: { id: 3, name: "X" },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "Duplicado" });
    expect(saved).toBe(false);
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

  test("ExportMarketing asks for a blob with the filter, leaving out Todos, and downloads it as an xlsx file", async () => {
    const click = vi.fn();
    const link = { href: "", setAttribute: vi.fn(), click };
    vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(link as unknown as HTMLElement);
    window.URL.createObjectURL = vi.fn(() => "blob:report");
    httpMock.mockResolvedValue({ data: new Blob(["xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) });

    await useMarketingStore().ExportMarketing({ ...defaultFilter, status: "null" });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "exportar_list_marketing",
      params: { ...defaultFilter, status: null },
      responseType: "blob",
      headers: JSON_HEADERS,
    });
    expect(link.href).toBe("blob:report");
    expect(link.setAttribute).toHaveBeenCalledWith("download", expect.stringMatching(/^Reporte Listado Marketing .* \.xlsx$/));
    expect(click).toHaveBeenCalledOnce();
  });

  test("ExportMarketing tells the user when there is nothing to export instead of downloading", async () => {
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({ href: "", setAttribute: vi.fn(), click } as unknown as HTMLElement);
    httpMock.mockResolvedValue({ data: new Blob([JSON.stringify(rejected())], { type: "application/json" }) });

    await useMarketingStore().ExportMarketing(defaultFilter);

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", text: "No se encontraron registros" });
    expect(click).not.toHaveBeenCalled();
  });

  test("a failed export tells the user what to do", async () => {
    httpMock.mockRejectedValue(new Error("500"));

    await useMarketingStore().ExportMarketing(defaultFilter);

    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      text: "No pudimos generar el Excel. Revisa tu conexión e intenta de nuevo.",
    });
  });
});
