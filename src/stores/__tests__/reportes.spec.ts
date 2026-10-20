import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useReportesStore } from "@/stores/reportes";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn(), dispatch: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn(), showLoading: vi.fn() } }));

describe("reportes store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "open").mockImplementation(() => null);
  });
  afterEach(() => vi.restoreAllMocks());

  test("exportReporteFile stamps the branch on the body, posts it and opens the PDF", async () => {
    respond({ createdPDF: {} });
    const reportes = useReportesStore();
    const body: Record<string, unknown> = { a: 1 };

    await reportes.exportReporteFile(body);

    expect(body.id_branch).toBe(7);
    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "createdPDF",
      headers: JSON_HEADERS,
      data: { a: 1, id_branch: 7 },
    });
    expect(vi.mocked(Swal.fire).mock.calls[1]![0]).toMatchObject({ icon: "success", title: "PDF Generado" });
    expect(window.open).toHaveBeenCalledWith(URL_MAIN + "REPORT_CONTROL_FILE.pdf", "_blank");
  });

  test("getListarBancosgastosDetalles stamps the branch, keeps accepted rows and empties the list otherwise", async () => {
    respond({ listar_banco_gasto_detalles: accepted([{ id: 1 }]) });
    const reportes = useReportesStore();

    await reportes.getListarBancosgastosDetalles({ mes: 2 });

    expect(httpMock.mock.calls[0]![0].params).toEqual({ mes: 2, id_branch: 7 });
    expect(reportes.listDetalle).toEqual([{ id: 1 }]);

    respond({ listar_banco_gasto_detalles: rejected() });
    await reportes.getListarBancosgastosDetalles({});
    expect(reportes.listDetalle).toEqual([]);
  });

  test.each([
    ["getTotalesMasterAgrupado", "obtener_totales_master_general"],
    ["getTotalesMasterGeneralAgrupado", "obtener_totales_master_genetal_general"],
  ] as const)("%s keeps the first row as the grouped total, saves the token and logs it", async (name, path) => {
    respond({ [path]: { ...accepted([{ total: 1 }, { total: 2 }]), token: "tok-g" } });
    const reportes = useReportesStore();

    await reportes[name]({ anio: 2026 });

    expect(httpMock.mock.calls[0]![0]).toMatchObject({ params: { anio: 2026 } });
    expect(reportes.totalMasterAgrupado).toEqual({ total: 1 });
    expect(sessionStorage.getItem("auth-token")).toBe("tok-g");
    expect(console.log).toHaveBeenCalledWith("data", { total: 1 });
  });

  test.each(["getTotalesMasterAgrupado", "getTotalesMasterGeneralAgrupado"] as const)(
    "%s leaves an empty array as the grouped total when the backend rejects",
    async (name) => {
      respond({
        obtener_totales_master_general: rejected(),
        obtener_totales_master_genetal_general: rejected(),
      });
      const reportes = useReportesStore();

      await reportes[name]({});

      expect(reportes.totalMasterAgrupado).toEqual([]);
    },
  );

  test.each([
    ["getTotalesMasterPorMes", "obtener_totales_master_por_mes"],
    ["getTotalesMasterGeneralPorMes", "obtener_totales_master_genetal_por_mes"],
  ] as const)("%s keeps the monthly rows and empties them when the backend rejects", async (name, path) => {
    respond({ [path]: accepted([{ mes: 1 }]) });
    const reportes = useReportesStore();

    await reportes[name]({});
    expect(reportes.totalMasterPorMes).toEqual([{ mes: 1 }]);

    respond({ [path]: rejected() });
    await reportes[name]({});
    expect(reportes.totalMasterPorMes).toEqual([]);
  });

  test.each([
    ["printTotalesMasterPorMes", "imprimir_reporte_ganancia"],
    ["imprimirReporteGananciaDetallado", "imprimir_reporte_ganancia_detallado"],
  ] as const)("%s opens the printed file and closes the waiting notice", async (name, path) => {
    respond({ [path]: { path: "files/x.pdf" } });
    const reportes = useReportesStore();

    await reportes[name]({ anio: 1 });

    expect(window.open).toHaveBeenCalledWith(URL_MAIN + "files/x.pdf", "_blank");
    expect(Swal.close).toHaveBeenCalled();
  });
});
