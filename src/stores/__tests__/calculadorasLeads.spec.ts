import { beforeEach, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const ACO_ONLY = "La calculadora de fletes la administra ACO. Ingresa con un usuario de ACO para usar esta pantalla.";
const jsonBlob = (body: unknown) => new Blob([JSON.stringify(body)], { type: "application/json" });

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  vi.restoreAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem("iso_pais", "9589");
  vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
});

const spyDownloadLink = () => {
  const click = vi.fn();
  const link = { href: "", setAttribute: vi.fn(), click };
  vi.spyOn(document, "createElement").mockReturnValue(link as unknown as HTMLElement);
  vi.spyOn(document.body, "appendChild").mockReturnValue(link as unknown as HTMLElement);
  window.URL.createObjectURL = vi.fn(() => "blob:leads");
  return link;
};

test("the leads export asks the session's country and downloads the workbook the server sends", async () => {
  const link = spyDownloadLink();
  httpMock.mockResolvedValue({
    data: new Blob(["xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  });

  await useCalculadorasStore().ExportarListUser();

  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "get",
      url: URL_MAIN + "export_listar_usuarios_calculadora",
      params: { id_pais: 9589 },
      responseType: "blob",
    }),
  );
  expect(link.href).toBe("blob:leads");
  expect(link.click).toHaveBeenCalledOnce();
});

test("the leads list and export send the same applied filters", async () => {
  const filters = {
    fechainicio: "2026-11-01",
    fechafin: "2026-11-06",
    id_status: 2,
    id_cliente: 3,
    id_shipment: 4,
    id_port_begin: 5,
    id_port_end: 6,
    email: "test@example.test",
    telefono: "123",
  };
  httpMock.mockResolvedValueOnce({ data: accepted([]) });
  await useCalculadorasStore().getListUserCalc(filters);
  expect(httpMock).toHaveBeenLastCalledWith(expect.objectContaining({
    method: "post",
    url: URL_MAIN + "listar_usuarios_calculadora",
    data: { iso_pais: 9589, ...filters },
  }));
  spyDownloadLink();
  httpMock.mockResolvedValueOnce({ data: new Blob(["xlsx"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }) });
  await useCalculadorasStore().ExportarListUser(filters);
  expect(httpMock).toHaveBeenLastCalledWith(expect.objectContaining({
    method: "get",
    url: URL_MAIN + "export_listar_usuarios_calculadora",
    params: { id_pais: 9589, ...filters },
  }));
});

test("an export with no leads shows the server's message instead of downloading", async () => {
  const link = spyDownloadLink();
  httpMock.mockResolvedValue({ data: jsonBlob(rejected("No se encontraron registros.")) });

  await useCalculadorasStore().ExportarListUser();

  expect(Swal.fire).toHaveBeenCalledWith({ icon: "info", text: "No se encontraron registros." });
  expect(link.click).not.toHaveBeenCalled();
});

test("a rejected filtered list keeps the previous results and shows the server message", async () => {
  const store = useCalculadorasStore();
  store.listUser = [{ id: "1", nombre: "Anterior" }];
  httpMock.mockResolvedValue({ data: rejected("No se pudo filtrar.") });

  expect(await store.getListUserCalc()).toBe(false);
  expect(store.listUser).toEqual([{ id: "1", nombre: "Anterior" }]);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ text: "No se pudo filtrar." }));
});

test("an export the server refuses shows its reason", async () => {
  const link = spyDownloadLink();
  httpMock.mockRejectedValue({ response: { status: 403, data: jsonBlob({ estadoflag: false, mensaje: ACO_ONLY }) } });

  await useCalculadorasStore().ExportarListUser();

  expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: ACO_ONLY });
  expect(link.click).not.toHaveBeenCalled();
});

test("an export that never reaches the server tells the user what to do", async () => {
  httpMock.mockRejectedValue(new Error("Network Error"));

  await useCalculadorasStore().ExportarListUser();

  expect(Swal.fire).toHaveBeenCalledWith({
    icon: "error",
    text: "No pudimos generar el Excel. Revisa tu conexión e intenta de nuevo.",
  });
});

test("a saved lead status shows the server's message and reports it was saved", async () => {
  respond({ "calc/actualizar/estado/cotizacion": { ...accepted([]), mensaje: "Actualización Correcta." } });

  const saved = await useCalculadorasStore().actualizarEstadoCotizacionCalculadora({ id: "5", id_status_quote: "3" });

  expect(httpMock).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "put",
      url: URL_MAIN + "calc/actualizar/estado/cotizacion",
      data: { id: "5", id_status_quote: "3" },
    }),
  );
  expect(saved).toBe(true);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "success", text: "Actualización Correcta." }));
});

test("a lead status the server refuses shows its reason and reports it was not saved", async () => {
  httpMock.mockRejectedValue({ response: { status: 403, data: { estadoflag: false, mensaje: ACO_ONLY } } });

  const saved = await useCalculadorasStore().actualizarEstadoCotizacionCalculadora({ id: "5", id_status_quote: "3" });

  expect(saved).toBe(false);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "error", text: ACO_ONLY }));
});
