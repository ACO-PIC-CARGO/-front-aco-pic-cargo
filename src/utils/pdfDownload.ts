import type { AxiosRequestConfig } from "axios";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";

interface PdfAnswer {
  estadoflag: boolean;
  mensaje: string;
  tipomensaje: string;
}

const UNREACHABLE: PdfAnswer = { estadoflag: false, mensaje: CONNECTION_ERROR_MESSAGE, tipomensaje: "TMSGERR" };
const URL_LIFETIME_MS = 60_000;

const readAnswer = async (body: unknown): Promise<PdfAnswer> => {
  if (!(body instanceof Blob)) return UNREACHABLE;
  try {
    const answer = JSON.parse(await body.text()) as Partial<PdfAnswer>;
    return answer.mensaje ? { ...UNREACHABLE, ...answer } : UNREACHABLE;
  } catch {
    return UNREACHABLE;
  }
};

const save = (pdf: Blob, fileName: string): void => {
  const url = URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), URL_LIFETIME_MS);
};

const requestFile = async (config: AxiosRequestConfig, fileName: string, fileType: string): Promise<PdfAnswer | null> => {
  try {
    const { data } = await axios<Blob>({ ...config, responseType: "blob" });
    if (!data.type.includes(fileType)) return readAnswer(data);
    save(data, fileName);
    return null;
  } catch (error) {
    return readAnswer((error as { response?: { data?: unknown } }).response?.data);
  }
};

const downloadFile = async (config: AxiosRequestConfig, fileName: string, fileType: string, label: string): Promise<boolean> => {
  Swal.fire({
    icon: "info",
    title: `Generando ${label}`,
    text: `Estamos preparando el ${label}. Espera un momento.`,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });
  const answer = await requestFile(config, fileName, fileType);
  if (!answer) {
    Swal.close();
    return true;
  }
  const icon = answer.estadoflag ? "success" : answer.tipomensaje === "TMSGERR" ? "error" : "info";
  Swal.fire({ icon, text: answer.mensaje });
  return answer.estadoflag;
};

export const downloadPdf = (config: AxiosRequestConfig, fileName: string): Promise<boolean> => downloadFile(config, fileName, "pdf", "PDF");

export const downloadExcel = (config: AxiosRequestConfig, fileName: string): Promise<boolean> =>
  downloadFile(config, fileName, "spreadsheetml", "Excel");
