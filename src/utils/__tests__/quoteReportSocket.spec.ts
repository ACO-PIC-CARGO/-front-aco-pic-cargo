import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import { downloadBlob } from "@/utils/pdfDownload";
import { requestQuoteReport } from "@/utils/quoteReportSocket";

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

vi.mock("socket.io-client", () => ({ io: vi.fn(() => socketHarness.socket) }));
vi.mock("@/api/http", () => ({ default: axiosMock }));
vi.mock("@/utils/pdfDownload", () => ({ downloadBlob: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("requestQuoteReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      text: "No pudimos generar el reporte.",
    }));
  });

  test("resubmits the filters after reconnecting before the PDF arrives", async () => {
    axiosMock
      .mockResolvedValueOnce({ status: 202, data: { branchId: 7, requestId: "request-old" } })
      .mockResolvedValueOnce({ status: 202, data: { branchId: 7, requestId: "request-new" } });

    await requestQuoteReport(
      { method: "post", url: "export_list_quote", data: { filtro: { id_status: 2 } } },
      "REPORTE_COTIZACIONES.pdf",
    );

    socketHarness.socket.connected = false;
    socketHarness.socket.active = false;
    socketHarness.dispatch("disconnect", "io server disconnect");
    await vi.waitFor(() => expect(axiosMock).toHaveBeenCalledTimes(2));

    socketHarness.dispatch("reporte-quote", {
      estadoflag: true,
      branchId: 7,
      requestId: "request-old",
      fileName: "old.pdf",
      contentType: "application/pdf",
      file: new Uint8Array([37, 80, 68, 70]),
    });
    expect(downloadBlob).not.toHaveBeenCalled();

    socketHarness.dispatch("reporte-quote", {
      estadoflag: true,
      branchId: 7,
      requestId: "request-new",
      fileName: "quotes.pdf",
      contentType: "application/pdf",
      file: new Uint8Array([37, 80, 68, 70]),
    });

    expect(axiosMock.mock.calls[1]![0]).toMatchObject({
      url: "export_list_quote",
      data: { filtro: { id_status: 2 } },
    });
    expect(downloadBlob).toHaveBeenCalledTimes(1);
  });
});
