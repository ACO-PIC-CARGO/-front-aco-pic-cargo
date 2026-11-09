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

export const downloadBlob = (file: Blob, fileName: string): void => save(file, fileName);

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
  return showAnswer(answer);
};

const showAnswer = (answer: PdfAnswer): boolean => {
  const icon = answer.estadoflag ? "success" : answer.tipomensaje === "TMSGERR" ? "error" : "info";
  Swal.fire({ icon, text: answer.mensaje });
  return answer.estadoflag;
};

const KEEP_WORKING_SECONDS = 5;

const showKeepWorkingNotice = (): void => {
  let secondsLeft = KEEP_WORKING_SECONDS;
  Swal.fire({
    icon: "info",
    title: "Generando PDF",
    html: `<p>El PDF se descargará solo cuando esté listo. Puedes continuar con tus actividades mientras se prepara.</p>
      <p id="pdfKeepWorking" style="margin-top: 15px; font-weight: 600;">Podrás continuar en ${secondsLeft} segundos...</p>`,
    confirmButtonText: "OK",
    showConfirmButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      const okButton = Swal.getConfirmButton();
      if (okButton) okButton.disabled = true;
      const countdown = setInterval(() => {
        secondsLeft--;
        const notice = document.getElementById("pdfKeepWorking");
        if (!notice || secondsLeft <= 0) {
          clearInterval(countdown);
          if (notice) notice.textContent = "Ya puedes continuar.";
          if (okButton) okButton.disabled = false;
          return;
        }
        notice.textContent = `Podrás continuar en ${secondsLeft} segundos...`;
      }, 1000);
    },
  });
};

export const downloadPdfInBackground = async (config: AxiosRequestConfig, fileName: string): Promise<boolean> => {
  showKeepWorkingNotice();
  const answer = await requestFile(config, fileName, "pdf");
  if (!answer) {
    Swal.fire({ icon: "success", title: "PDF generado", text: "Tu PDF ya se descargó." });
    return true;
  }
  return showAnswer(answer);
};

export const downloadPdf = (config: AxiosRequestConfig, fileName: string): Promise<boolean> => downloadFile(config, fileName, "pdf", "PDF");

export const downloadExcel = (config: AxiosRequestConfig, fileName: string): Promise<boolean> =>
  downloadFile(config, fileName, "spreadsheetml", "Excel");
