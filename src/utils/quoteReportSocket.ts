import type { AxiosRequestConfig } from "axios";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
import "@/styles/quote-report-alert.css";
import axios from "@/api/http";
import { downloadBlob } from "@/utils/pdfDownload";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

interface QuoteReportId {
  branchId?: number | string;
  userId?: number | string;
  requestId: number | string;
}

interface QuoteReportResponse extends QuoteReportId {
  estadoflag: boolean;
  contentType?: string;
  file?: unknown;
  fileName?: string;
  mensaje?: string;
}

const REPORT_EVENT = "reporte-quote";
const PENDING_REPORTS = "pending-quote-reports";
const REPORT_SUCCESS_MESSAGE = "Puedes guardarlo o verlo en tu carpeta de Descarga.";
const quoteReportSocket = io(import.meta.env.VITE_URL_MAIN, {
  transports: ["polling"],
  autoConnect: false,
});

let connectedToken: string | null = null;
let connectionPromise: Promise<void> | null = null;

type QuoteReportAlertStatus = "info" | "success" | "error";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]!);
}

function showQuoteReportAlert(
  status: QuoteReportAlertStatus,
  title: string,
  message: string,
  actionLabel = "Entendido",
): void {
  const icon = status === "info" ? "i" : status === "success" ? "✓" : "!";
  const iconContent = status === "info"
    ? `<svg class="quote-report-document-icon" viewBox="0 0 128 128" aria-hidden="true">
        <path d="M35 10h39l21 21v45M74 10v22h22M35 10v102h34" />
        <path d="M49 42h24M49 57h22M49 72h13" />
        <circle cx="91" cy="88" r="25" />
        <path d="M91 74v15l10 6" />
      </svg>`
    : `<span class="quote-report-icon-symbol">${icon}</span>`;
  const content = status === "info"
    ? `<div class="quote-report-time-banner"><span class="quote-report-clock"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" /><path d="M20 11v9l6 4" /></svg></span><span>Tomará entre <b>20 y 40 segundos.</b></span></div>
       <p class="quote-report-followup">Te avisaremos una vez esté listo.</p>`
    : `<p class="quote-report-message">${escapeHtml(message)}</p>`;

  void Swal.fire({
    icon: status,
    iconHtml: iconContent,
    title,
    html: content,
    confirmButtonText: `✓ ${actionLabel}`,
    buttonsStyling: false,
    customClass: {
      container: "quote-report-container",
      popup: `quote-report-popup quote-report-popup--${status}`,
      icon: `quote-report-icon quote-report-icon--${status}`,
      title: "quote-report-title",
      htmlContainer: "quote-report-content",
      confirmButton: `quote-report-button quote-report-button--${status}`,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isIdentifier(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function parseQuoteReportId(value: unknown): QuoteReportId | null {
  if (!isRecord(value) || !isIdentifier(value.requestId)) return null;
  const branchId = isIdentifier(value.branchId) ? value.branchId : undefined;
  const userId = isIdentifier(value.userId) ? value.userId : undefined;
  return branchId !== undefined || userId !== undefined
    ? { branchId, userId, requestId: value.requestId }
    : null;
}

function parseQuoteReportResponse(value: unknown): QuoteReportResponse | null {
  if (!isRecord(value) || typeof value.estadoflag !== "boolean") return null;
  const ids = parseQuoteReportId(value);
  return ids ? {
    ...ids,
    estadoflag: value.estadoflag,
    contentType: typeof value.contentType === "string" ? value.contentType : undefined,
    file: value.file,
    fileName: typeof value.fileName === "string" ? value.fileName : undefined,
    mensaje: typeof value.mensaje === "string" ? value.mensaje : undefined,
  } : null;
}

function sameIdentifier(left: number | string, right: number | string): boolean {
  return String(left) === String(right);
}

function matchesSession(value: QuoteReportId, branchId: number, userId: number | string): boolean {
  return (value.branchId === undefined || sameIdentifier(value.branchId, branchId)) &&
    (value.userId === undefined || sameIdentifier(value.userId, userId));
}

async function connectQuoteReportSocket(): Promise<void> {
  const token = sessionStorage.getItem("auth-token");
  if (!token) throw new Error("No se encontró el token de sesión para conectar el reporte.");
  if (quoteReportSocket.connected && connectedToken === token) return;
  if (connectionPromise) return connectionPromise;

  if (quoteReportSocket.connected) quoteReportSocket.disconnect();
  quoteReportSocket.auth = { token };
  connectedToken = token;

  connectionPromise = new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      quoteReportSocket.off("connect", onConnect);
      quoteReportSocket.off("connect_error", onConnectError);
    };
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onConnectError = (error: Error) => {
      cleanup();
      quoteReportSocket.disconnect();
      reject(error);
    };

    quoteReportSocket.once("connect", onConnect);
    quoteReportSocket.once("connect_error", onConnectError);
    if (!quoteReportSocket.active) quoteReportSocket.connect();
  }).finally(() => {
    connectionPromise = null;
  });

  return connectionPromise;
}

function toPdfBlob(file: unknown, contentType: string): Blob | null {
  if (file instanceof Blob) return new Blob([file], { type: contentType });
  if (file instanceof ArrayBuffer) return new Blob([file], { type: contentType });
  if (ArrayBuffer.isView(file)) {
    const bytes = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
    return new Blob([new Uint8Array(bytes)], { type: contentType });
  }
  if (isRecord(file) && file.type === "Buffer" && Array.isArray(file.data) && file.data.every((byte) => typeof byte === "number")) {
    return new Blob([new Uint8Array(file.data)], { type: contentType });
  }
  return null;
}

function httpErrorMessage(error: unknown): string {
  if (isRecord(error) && isRecord(error.response) && isRecord(error.response.data) && typeof error.response.data.mensaje === "string") {
    return error.response.data.mensaje;
  }
  if (error instanceof Error && error.message) return error.message;
  return "No pudimos iniciar el reporte. Intenta de nuevo en unos minutos.";
}

function pendingReports(): QuoteReportId[] {
  const raw = sessionStorage.getItem(PENDING_REPORTS);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Lista de reportes inválida");
    return parsed.map(parseQuoteReportId).filter((item): item is QuoteReportId => item !== null);
  } catch (error) {
    console.error("No se pudieron leer los reportes pendientes:", error);
    return [];
  }
}

function savePending(report: QuoteReportId): void {
  const reports = pendingReports().filter((item) => !sameIdentifier(item.requestId, report.requestId));
  reports.push(report);
  sessionStorage.setItem(PENDING_REPORTS, JSON.stringify(reports));
}

function forgetPending(report: QuoteReportId): void {
  const reports = pendingReports().filter((item) => !sameIdentifier(item.requestId, report.requestId));
  if (reports.length) sessionStorage.setItem(PENDING_REPORTS, JSON.stringify(reports));
  else sessionStorage.removeItem(PENDING_REPORTS);
}

function dismissReport(report: QuoteReportId): void {
  void axios.delete(`reporte_quote/${encodeURIComponent(String(report.requestId))}`)
    .catch((error: unknown) => console.error("No se pudo liberar el reporte temporal:", error));
}

async function recoverPendingReport(
  report: QuoteReportId,
  shouldContinue: () => boolean = () => true,
  onFinished: () => void = () => undefined,
): Promise<void> {
  if (!shouldContinue()) return;
  try {
    const response = await axios.get<Blob>(`reporte_quote/${encodeURIComponent(String(report.requestId))}`, { responseType: "blob" });
    if (!shouldContinue()) return;
    const type = String(response.headers["content-type"] || "");
    if (type.includes("application/pdf")) {
      const disposition = String(response.headers["content-disposition"] || "");
      const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || "REPORTE_COTIZACIONES.pdf";
      downloadBlob(response.data, name);
      onFinished();
      forgetPending(report);
      dismissReport(report);
      showQuoteReportAlert("success", "Reporte generado", REPORT_SUCCESS_MESSAGE, "Aceptar");
      return;
    }
    const result: unknown = JSON.parse(await response.data.text());
    if (isRecord(result) && result.status === "pending") {
      window.setTimeout(() => void recoverPendingReport(report, shouldContinue, onFinished), 5000);
      return;
    }
    if (isRecord(result) && result.status === "failed" && typeof result.mensaje === "string") {
      forgetPending(report);
      onFinished();
      dismissReport(report);
      showQuoteReportAlert("error", "No se pudo generar el reporte", result.mensaje);
      return;
    }
    throw new Error("El servidor devolvió un estado de reporte inválido.");
  } catch (error) {
    if (!shouldContinue()) return;
    if (isRecord(error) && isRecord(error.response) && error.response.status === 404) {
      forgetPending(report);
      onFinished();
      showQuoteReportAlert("error", "Reporte no disponible", "El reporte expiró o el servidor se reinició. Solicítalo nuevamente.");
    } else {
      console.error("No se pudo recuperar el reporte:", error);
      showQuoteReportAlert("error", "No se pudo recuperar el reporte", "Recarga la página para volver a intentar.");
    }
  }
}

export function resumeQuoteReports(): void {
  if (!sessionStorage.getItem("auth-token")) return;
  let branchId: number;
  let userId: number | string;
  try {
    branchId = sessionBranchId();
    const login = sessionUser().users;
    if (!login) throw new Error("No se encontró el usuario de sesión.");
    userId = login;
  } catch (error) {
    console.error("No se pudo identificar la sesión para recuperar reportes:", error);
    return;
  }
  for (const report of pendingReports()) {
    if (matchesSession(report, branchId, userId)) void recoverPendingReport(report);
  }
}

export async function requestQuoteReport(config: AxiosRequestConfig, fallbackFileName: string): Promise<void> {
  try {
    await connectQuoteReportSocket();
  } catch {
    showQuoteReportAlert(
      "error",
      "No se pudo conectar",
      "No pudimos conectar con el servicio de reportes. Intenta nuevamente.",
    );
    return;
  }

  let branchId: number;
  let userId: number | string;
  try {
    branchId = sessionBranchId();
    const sessionUserId = sessionUser().users;
    if (sessionUserId === undefined || sessionUserId === null || sessionUserId === "") {
      throw new Error("No se encontró el usuario de sesión.");
    }
    userId = sessionUserId;
  } catch {
    quoteReportSocket.disconnect();
    showQuoteReportAlert(
      "error",
      "No se pudo identificar la sesión",
      "Vuelve a iniciar sesión e intenta generar el reporte nuevamente.",
    );
    return;
  }
  let activeRequest: QuoteReportId | null = null;
  let earlyResponse: QuoteReportResponse | null = null;
  let isSending = false;
  let retryAfterSend = false;
  let disconnectedBeforeResponse = false;
  let completed = false;

  const cleanup = () => {
    quoteReportSocket.off(REPORT_EVENT, onReport);
    quoteReportSocket.off("disconnect", onDisconnect);
    quoteReportSocket.off("connect", onReconnect);
  };
  const finishWithError = (message: string) => {
    if (completed) return;
    completed = true;
    cleanup();
    showQuoteReportAlert("error", "No se pudo generar el reporte", message);
  };
  const finishWithResponse = (response: QuoteReportResponse) => {
    if (completed) return;
    completed = true;
    cleanup();
    if (!response.estadoflag) {
      forgetPending(response);
      dismissReport(response);
      showQuoteReportAlert(
        "error",
        "No se pudo generar el reporte",
        response.mensaje || "No pudimos generar el reporte. Intenta de nuevo en unos minutos.",
      );
      return;
    }

    const contentType = response.contentType || "application/pdf";
    const file = toPdfBlob(response.file, contentType);
    if (!file || !contentType.toLowerCase().includes("pdf")) {
      showQuoteReportAlert(
        "error",
        "No se pudo descargar el reporte",
        "El servidor no entregó un archivo PDF válido.",
      );
      return;
    }

    downloadBlob(file, response.fileName || fallbackFileName);
    forgetPending(response);
    dismissReport(response);
    showQuoteReportAlert(
      "success",
      "Reporte generado",
      REPORT_SUCCESS_MESSAGE,
      "Aceptar",
    );
  };
  const onReport = (payload: unknown) => {
    const response = parseQuoteReportResponse(payload);
    if (!response || !matchesSession(response, branchId, userId)) return;
    if (!activeRequest) {
      earlyResponse = response;
      return;
    }
    if (sameIdentifier(response.requestId, activeRequest.requestId)) {
      finishWithResponse(response);
    }
  };
  const sendRequest = async (): Promise<void> => {
    if (completed) return;
    if (isSending) {
      retryAfterSend = true;
      return;
    }
    isSending = true;
    try {
      const response = await axios({ ...config, responseType: "json" });
      const request = parseQuoteReportId(response.data);
      if (response.status !== 202 || !request) {
        throw new Error("El servidor no aceptó la solicitud del reporte.");
      }
      if (!matchesSession(request, branchId, userId)) {
        throw new Error("La solicitud del reporte respondió con una sucursal o usuario distinto.");
      }
      activeRequest = request;
      savePending(request);
      if (
        earlyResponse &&
        matchesSession(earlyResponse, branchId, userId) &&
        sameIdentifier(earlyResponse.requestId, request.requestId)
      ) {
        finishWithResponse(earlyResponse);
      }
      earlyResponse = null;
      if (!completed) {
        window.setTimeout(() => void recoverPendingReport(
          request,
          () => !completed && activeRequest === request,
          () => { completed = true; cleanup(); },
        ), 5000);
      }
    } catch (error) {
      if (!quoteReportSocket.connected || disconnectedBeforeResponse || retryAfterSend) {
        retryAfterSend = true;
      } else {
        finishWithError(httpErrorMessage(error));
      }
    } finally {
      isSending = false;
      if (retryAfterSend && quoteReportSocket.connected && !completed) {
        retryAfterSend = false;
        activeRequest = null;
        earlyResponse = null;
        void sendRequest();
      }
    }
  };
  const onDisconnect = () => {
    disconnectedBeforeResponse = true;
    const token = sessionStorage.getItem("auth-token");
    if (token) {
      quoteReportSocket.auth = { token };
      connectedToken = token;
    }
    if (!quoteReportSocket.active) quoteReportSocket.connect();
  };
  const onReconnect = () => {
    if (!disconnectedBeforeResponse || completed) return;
    disconnectedBeforeResponse = false;
    if (activeRequest) {
      completed = true;
      cleanup();
      void recoverPendingReport(activeRequest);
      return;
    }
    retryAfterSend = true;
    if (!isSending) {
      retryAfterSend = false;
      activeRequest = null;
      earlyResponse = null;
      void sendRequest();
    }
  };

  quoteReportSocket.on(REPORT_EVENT, onReport);
  quoteReportSocket.on("disconnect", onDisconnect);
  quoteReportSocket.on("connect", onReconnect);
  showQuoteReportAlert(
    "info",
    "Generando Reporte",
    "El documento se descargará automáticamente cuando esté listo.",
    "Puedes continuar trabajando",
  );
  await sendRequest();
}
