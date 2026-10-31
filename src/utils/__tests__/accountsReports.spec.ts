import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import http from "@/api/http";
import { adminReceivableTotals, downloadExternalFile, payableQuery, receivableQuery, unscheduledLines } from "@/utils/accountsReports";
import { downloadExcel } from "@/utils/pdfDownload";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn(), showLoading: vi.fn() } }));

const httpMock = vi.mocked(http as unknown as (config: unknown) => Promise<{ data: unknown }>);

describe("receivableQuery and payableQuery", () => {
  test("send the same filters, joining multiple choices and leaving out the empty ones", () => {
    expect(receivableQuery({ clients: [3, 5], arrival: "0", to: "2026-10-30", file: "", incomes: "", subIncomes: [7] })).toEqual({
      id_cliente: "3,5",
      llegadaflag: "0",
      fechahasta: "2026-10-30",
      id_subingreso: "7",
    });
    expect(payableQuery({ providers: [], arrival: "1", to: "", file: "1736", expenses: [2], subExpenses: "" })).toEqual({
      llegada: "1",
      nro_expediente: "1736",
      id_gasto: "2",
    });
  });
});

describe("adminReceivableTotals", () => {
  test("totals the pending amount once, with the tax shown apart, per currency", () => {
    const rows = [
      { details: [{ symbol: "USD", total_pagar: "118.00", igv: "18.00" }, { symbol: "S/.", total_pagar: "59.00", igv: "9.00" }] },
      { details: [{ symbol: "USD", total_pagar: "10.00", igv: "0" }] },
    ];

    expect(adminReceivableTotals(rows as never, "PEN")).toEqual([
      { moneda: "USD", monto: "128.00", igv: "18.00", total: "128.00" },
      { moneda: "PEN", monto: "59.00", igv: "9.00", total: "59.00" },
    ]);
  });
});

describe("unscheduledLines", () => {
  test("offers only the lines not yet in a payment schedule", () => {
    expect(unscheduledLines([{ id: 1, programado: 0 }, { id: 2, programado: 1 }])).toEqual([{ id: 1, programado: 0 }]);
  });
});

describe("downloadExternalFile", () => {
  let saved: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    saved = [];
    URL.createObjectURL = vi.fn(() => "blob:factura");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download || this.href);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  test("downloads a third-party invoice without the session headers", async () => {
    const fetchMock = vi.fn(async () => new Response(new Blob(["%PDF"]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await downloadExternalFile("https://api.example.com/factura.pdf", "FACTURA 1.pdf");

    expect(fetchMock).toHaveBeenCalledWith("https://api.example.com/factura.pdf");
    expect(httpMock).not.toHaveBeenCalled();
    expect(saved).toEqual(["FACTURA 1.pdf"]);
  });

  test("opens the invoice link when the other site does not allow the download", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("CORS"))));
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    await downloadExternalFile("https://api.example.com/factura.pdf", "FACTURA 1.pdf");

    expect(open).toHaveBeenCalledWith("https://api.example.com/factura.pdf", "_blank", "noopener");
  });
});

describe("downloadExcel", () => {
  test("shows the server's answer instead of saving a refused export", async () => {
    httpMock.mockResolvedValue({
      data: new Blob([JSON.stringify({ estadoflag: false, mensaje: "Tu sesión no es válida.", tipomensaje: "TMSGADV" })], { type: "application/json" }),
    });

    expect(await downloadExcel({ url: "reportcxcexcel" }, "Reporte.xlsx")).toBe(false);

    expect(vi.mocked(Swal.fire).mock.lastCall![0]).toMatchObject({ icon: "info", text: "Tu sesión no es válida." });
  });
});
