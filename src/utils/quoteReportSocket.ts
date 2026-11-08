import type { AxiosRequestConfig } from "axios";
import { io } from "socket.io-client";
import Swal from "sweetalert2";
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
const quoteReportSocket = io(import.meta.env.VITE_URL_MAIN, {
  transports: ["polling"],
  autoConnect: false,
});

let connectedToken: string | null = null;
let connectionPromise: Promise<void> | null = null;

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
  if (value.branchId !== undefined) return sameIdentifier(value.branchId, branchId);
  return value.userId !== undefined && sameIdentifier(value.userId, userId);
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

export async function requestQuoteReport(config: AxiosRequestConfig, fallbackFileName: string): Promise<void> {
  try {
    await connectQuoteReportSocket();
  } catch {
    Swal.fire({
      icon: "error",
      title: "No se pudo conectar",
      text: "No pudimos conectar con el servicio de reportes. Intenta nuevamente.",
    });
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
    Swal.fire({
      icon: "error",
      title: "No se pudo identificar la sesión",
      text: "Vuelve a iniciar sesión e intenta generar el reporte nuevamente.",
    });
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
    Swal.fire({ icon: "error", title: "No se pudo generar el reporte", text: message });
  };
  const finishWithResponse = (response: QuoteReportResponse) => {
    if (completed) return;
    completed = true;
    cleanup();
    if (!response.estadoflag) {
      Swal.fire({
        icon: "error",
        title: "No se pudo generar el reporte",
        text: response.mensaje || "No pudimos generar el reporte. Intenta de nuevo en unos minutos.",
      });
      return;
    }

    const contentType = response.contentType || "application/pdf";
    const file = toPdfBlob(response.file, contentType);
    if (!file || !contentType.toLowerCase().includes("pdf")) {
      Swal.fire({
        icon: "error",
        title: "No se pudo descargar el reporte",
        text: "El servidor no entregó un archivo PDF válido.",
      });
      return;
    }

    downloadBlob(file, response.fileName || fallbackFileName);
    Swal.fire({
      icon: "success",
      title: "Reporte listo",
      text: "El documento se descargó automáticamente.",
    });
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
      if (
        earlyResponse &&
        matchesSession(earlyResponse, branchId, userId) &&
        sameIdentifier(earlyResponse.requestId, request.requestId)
      ) {
        finishWithResponse(earlyResponse);
      }
      earlyResponse = null;
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
  Swal.fire({
    icon: "info",
    title: "Reporte en proceso",
    text: "El documento se descargará automáticamente cuando esté listo.",
    showConfirmButton: true,
  });
  await sendRequest();
}
