import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import { downloadBlob } from "@/utils/pdfDownload";
import { requestQuoteReport, resumeQuoteReports } from "@/utils/quoteReportSocket";

const socketHarness = vi.hoisted(() => {
  type Listener = (...args: unknown[]) => void;
  const handlers = new Map<string, Set<Listener>>();
  const dispatch = (event: string, ...args: unknown[]) => {
    for (const listener of [...(handlers.get(event) ?? [])]) listener(...args);
  };
  const socket = {
    connected: false,
    active: false,
    auth: {} as Record<string, string>,
    on(event: string, listener: Listener) {
      const eventHandlers = handlers.get(event) ?? new Set<Listener>();
      eventHandlers.add(listener);
      handlers.set(event, eventHandlers);
      return this;
    },
    once(event: string, listener: Listener) {
      const wrapped: Listener = (...args) => {
        this.off(event, wrapped);
        listener(...args);
      };
      return this.on(event, wrapped);
    },
    off(event: string, listener?: Listener) {
      if (listener) handlers.get(event)?.delete(listener);
      else handlers.delete(event);
      return this;
    },
    connect() {
      this.connected = true;
      this.active = true;
      dispatch("connect");
      return this;
    },
    disconnect() {
      const wasConnected = this.connected;
      this.connected = false;
      this.active = false;
      if (wasConnected) dispatch("disconnect", "io client disconnect");
      return this;
    },
  };
  return {
    socket,
    dispatch,
    reset() {
      handlers.clear();
      socket.connected = false;
      socket.active = false;
      socket.auth = {};
    },
  };
});

const axiosMock = vi.hoisted(() => vi.fn());
const getMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());

vi.mock("socket.io-client", () => ({ io: vi.fn(() => socketHarness.socket) }));
vi.mock("@/api/http", () => ({ default: Object.assign(axiosMock, { get: getMock, delete: deleteMock }) }));
vi.mock("@/utils/pdfDownload", () => ({ downloadBlob: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("requestQuoteReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteMock.mockResolvedValue({});
    socketHarness.reset();
    sessionStorage.setItem("auth-token", "session-token");
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, users: "czuritar" }]));
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  test("authenticates before posting, then downloads the matching binary response", async () => {
    axiosMock.mockResolvedValue({
      status: 202,
      data: { branchId: 7, userId: "czuritar", requestId: "request-1" },
    });

    await requestQuoteReport(
      { method: "post", url: "export_list_quote", data: { filtro: { fechainicio: "2026-01-01" } } },
      "REPORTE_COTIZACIONES.pdf",
    );

    expect(socketHarness.socket.auth).toEqual({ token: "session-token" });
    expect(axiosMock).toHaveBeenCalledWith({
      method: "post",
      url: "export_list_quote",
      data: { filtro: { fechainicio: "2026-01-01" } },
      responseType: "json",
    });
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: "Generando Reporte",
      confirmButtonText: "✓ Puedes continuar trabajando",
      html: expect.stringContaining("Tomará entre <b>20 y 40 segundos.</b>"),
    }));

    socketHarness.dispatch("reporte-quote", {
      estadoflag: true,
      branchId: 7,
      userId: "czuritar",
      requestId: "request-1",
      fileName: "quotes.pdf",
      contentType: "application/pdf",
      file: new Uint8Array([37, 80, 68, 70]),
    });

    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "quotes.pdf");
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: "success" }));
  });

  test("shows the backend error for a matching failed report", async () => {
    axiosMock.mockResolvedValue({
      status: 202,
      data: { userId: "czuritar", requestId: "request-2" },
    });

    await requestQuoteReport(
      { method: "post", url: "export_list_quote", data: {} },
      "REPORTE_COTIZACIONES.pdf",
    );

    socketHarness.dispatch("reporte-quote", {
      estadoflag: false,
      userId: "czuritar",
      requestId: "request-2",
      mensaje: "No pudimos generar el reporte.",
    });

    expect(downloadBlob).not.toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({
      icon: "error",
      html: expect.stringContaining("No pudimos generar el reporte."),
    }));
  });

  test("recovers the original report after reconnecting instead of resubmitting", async () => {
    axiosMock.mockResolvedValueOnce({ status: 202, data: { branchId: 7, userId: "czuritar", requestId: "request-old" } });
    getMock.mockResolvedValueOnce({
      headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="quotes.pdf"' },
      data: new Blob(["%PDF"], { type: "application/pdf" }),
    });

    await requestQuoteReport(
      { method: "post", url: "export_list_quote", data: { filtro: { id_status: 2 } } },
      "REPORTE_COTIZACIONES.pdf",
    );

    socketHarness.socket.connected = false;
    socketHarness.socket.active = false;
    socketHarness.dispatch("disconnect", "io server disconnect");
    await vi.waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1));
    expect(axiosMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith("reporte_quote/request-old", { responseType: "blob" });
    expect(downloadBlob).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith("reporte_quote/request-old");
  });

  test("recovers a pending report after page reload", async () => {
    sessionStorage.setItem("pending-quote-reports", JSON.stringify([
      { branchId: 7, userId: "czuritar", requestId: "request-1" },
      { branchId: 7, userId: "otro", requestId: "request-2" },
    ]));
    getMock.mockResolvedValueOnce({
      headers: { "content-type": "application/pdf", "content-disposition": 'attachment; filename="reporte.pdf"' },
      data: new Blob(["%PDF"], { type: "application/pdf" }),
    });
    resumeQuoteReports();
    await vi.waitFor(() => expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), "reporte.pdf"));
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith("reporte_quote/request-1");
    expect(sessionStorage.getItem("pending-quote-reports")).toContain("request-2");
  });

  test("notifies when a report is no longer available after a reload", async () => {
    sessionStorage.setItem("pending-quote-reports", JSON.stringify([
      { branchId: 7, userId: "czuritar", requestId: "expired" },
    ]));
    getMock.mockRejectedValueOnce({ response: { status: 404 } });
    resumeQuoteReports();
    await vi.waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: "Reporte no disponible" })));
    expect(sessionStorage.getItem("pending-quote-reports")).toBeNull();
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
