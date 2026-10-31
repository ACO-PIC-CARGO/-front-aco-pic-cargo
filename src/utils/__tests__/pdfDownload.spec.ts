import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import http from "@/api/http";
import { downloadPdf } from "@/utils/pdfDownload";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), close: vi.fn(), showLoading: vi.fn() } }));

const httpMock = vi.mocked(http as unknown as (config: unknown) => Promise<{ data: unknown }>);
const CONNECTION_ERROR_MESSAGE = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";
const CONFIG = { method: "post", url: "createdPDF", data: { status_op: "0" } };

const json = (body: unknown) => new Blob([JSON.stringify(body)], { type: "application/json" });
const lastNotice = () => vi.mocked(Swal.fire).mock.lastCall![0];

describe("downloadPdf", () => {
  let saved: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    saved = [];
    URL.createObjectURL = vi.fn(() => "blob:pdf");
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      saved.push(this.download);
    });
  });
  afterEach(() => vi.restoreAllMocks());

  test("asks for the PDF as a file, saves it under the given name and closes the waiting notice", async () => {
    httpMock.mockResolvedValue({ data: new Blob(["%PDF-1.4"], { type: "application/pdf" }) });

    expect(await downloadPdf(CONFIG, "REPORTE.pdf")).toBe(true);

    expect(httpMock).toHaveBeenCalledWith({ ...CONFIG, responseType: "blob" });
    expect(saved).toEqual(["REPORTE.pdf"]);
    expect(Swal.close).toHaveBeenCalled();
  });

  test("shows the server's answer instead of saving when there is nothing to print", async () => {
    httpMock.mockResolvedValue({ data: json({ estadoflag: false, mensaje: "No hay expedientes con esos filtros.", tipomensaje: "TMSGINF" }) });

    expect(await downloadPdf(CONFIG, "REPORTE.pdf")).toBe(false);

    expect(saved).toEqual([]);
    expect(lastNotice()).toMatchObject({ icon: "info", text: "No hay expedientes con esos filtros." });
  });

  test("replaces the waiting notice with the server's friendly error when printing fails", async () => {
    httpMock.mockRejectedValue({ response: { data: json({ estadoflag: false, mensaje: "No pudimos completar la operación.", tipomensaje: "TMSGERR" }) } });

    expect(await downloadPdf(CONFIG, "REPORTE.pdf")).toBe(false);

    expect(lastNotice()).toMatchObject({ icon: "error", text: "No pudimos completar la operación." });
  });

  test("tells the user to check the connection when the server does not answer", async () => {
    httpMock.mockRejectedValue(new Error("Network Error"));

    await downloadPdf(CONFIG, "REPORTE.pdf");

    expect(lastNotice()).toMatchObject({ icon: "error", text: CONNECTION_ERROR_MESSAGE });
  });

  test("confirms a PDF the server saved somewhere else instead of downloading it", async () => {
    httpMock.mockResolvedValue({ data: json({ estadoflag: true, mensaje: "Guardamos el PDF en la carpeta del expediente.", tipomensaje: "TMSGSUC" }) });

    expect(await downloadPdf(CONFIG, "REPORTE.pdf")).toBe(true);

    expect(saved).toEqual([]);
    expect(lastNotice()).toMatchObject({ icon: "success", text: "Guardamos el PDF en la carpeta del expediente." });
  });
});
