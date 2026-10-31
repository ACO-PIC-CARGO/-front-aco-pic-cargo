import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useReportesStore } from "@/stores/reportes";
import { downloadPdf } from "@/utils/pdfDownload";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn(), showLoading: vi.fn() } }));
vi.mock("@/utils/pdfDownload", () => ({ downloadPdf: vi.fn(async () => true) }));

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

  test("exportReporteFile downloads the control file PDF of the filters, leaving the branch to the session", async () => {
    const reportes = useReportesStore();

    await reportes.exportReporteFile({ status_op: "0" });

    expect(downloadPdf).toHaveBeenCalledWith(
      { method: "post", url: URL_MAIN + "createdPDF", data: { status_op: "0" } },
      "REPORTE_CONTROL_FILE.pdf",
    );
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
    ["printTotalesMasterPorMes", "imprimir_reporte_ganancia", "REPORTE_GANANCIA_2026.pdf"],
    ["imprimirReporteGananciaDetallado", "imprimir_reporte_ganancia_detallado", "REPORTE_GANANCIA_DETALLADO_2026.pdf"],
  ] as const)("%s downloads the printed report for the chosen period", async (name, path, fileName) => {
    const reportes = useReportesStore();

    await reportes[name]({ year: 2026, mes: "01" });

    expect(downloadPdf).toHaveBeenCalledWith(
      { method: "get", url: URL_MAIN + path, params: { year: 2026, mes: "01" } },
      fileName,
    );
  });
});
