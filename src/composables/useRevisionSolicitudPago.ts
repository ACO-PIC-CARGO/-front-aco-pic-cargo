import { ref } from "vue";
import Swal from "sweetalert2";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";
import "@/styles/solicitud-pago-aprobacion.css";

export type AreaRevision = "ADM" | "GER";

// Quién revisa cada paso de una solicitud de pago (position_code de la sesión).
// Administración: 04 o 01 | Gerencia: 01 (el 01 ve los dos botones).
// El backend valida lo mismo en function_solicitudpago_rol_revision.
export const PERFIL_REVISION: Record<AreaRevision, string[]> = { ADM: ["04", "01"], GER: ["01"] };

export function tienePerfilRevision(tipo: AreaRevision): boolean {
  try {
    const perfiles = (sessionUser().position_code ?? []).map(String);
    return PERFIL_REVISION[tipo].some((p) => perfiles.includes(p));
  } catch {
    return false;
  }
}

const escapar = (valor: unknown) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface SolicitudARevisar {
  id: number;
  proveedor: string;
  id_proveedor: number;
  monto: number | string;
  moneda: string | null;
}

// Aprobar o rechazar (con motivo) una solicitud; alTerminar recarga el listado
export function useRevisionSolicitudPago(alTerminar: () => unknown) {
  const URL_MAIN = import.meta.env.VITE_URL_MAIN;
  const revisando = ref<number | null>(null);

  async function enviar(s: SolicitudARevisar, ruta: string, data: Record<string, string>) {
    revisando.value = s.id;
    const response = await request({ method: "put", url: URL_MAIN + ruta + "/" + s.id, data });
    revisando.value = null;
    if (!response.estadoflag) {
      Swal.fire({
        icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
        text: response.mensaje || CONNECTION_ERROR_MESSAGE,
      });
      return;
    }
    notifySuccess(response.mensaje);
    await alTerminar();
  }

  async function revisar(s: SolicitudARevisar, tipo: AreaRevision) {
    const area = tipo === "ADM" ? "ADMINISTRACIÓN" : "GERENCIA";
    const monto = Number(s.monto || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fila = (icono: string, etiqueta: string, valor: string) =>
      `<div class="aprob-modal__row"><i class="mdi ${icono}" aria-hidden="true"></i>` +
      `<span class="aprob-modal__label">${etiqueta}</span><span class="aprob-modal__value">${valor}</span></div>`;
    const decision = await Swal.fire({
      iconHtml: '<i class="mdi mdi-file-document-check-outline" aria-hidden="true"></i>',
      title: `APROBACIÓN POR ${area}`,
      html:
        '<p class="aprob-modal__question">¿DESEAS APROBAR ESTA SOLICITUD?</p>' +
        '<div class="aprob-modal__box">' +
        fila("mdi-storefront-outline", "ID PROVEEDOR:", escapar(s.id_proveedor)) +
        fila("mdi-account-outline", "PROVEEDOR:", escapar(s.proveedor)) +
        fila("mdi-cash-multiple", "MONTO:", `${monto} ${escapar(s.moneda ?? "")}`.trim()) +
        "</div>",
      showCancelButton: true,
      showDenyButton: true,
      buttonsStyling: false,
      confirmButtonText: '<i class="mdi mdi-check" aria-hidden="true"></i> APROBAR',
      denyButtonText: '<i class="mdi mdi-close" aria-hidden="true"></i> RECHAZAR',
      cancelButtonText: '<i class="mdi mdi-close" aria-hidden="true"></i> CANCELAR',
      customClass: {
        popup: "aprob-modal",
        icon: "aprob-modal__icon",
        title: "aprob-modal__title",
        htmlContainer: "aprob-modal__content",
        actions: "aprob-modal__actions",
        confirmButton: "aprob-modal__btn aprob-modal__btn--ok",
        denyButton: "aprob-modal__btn aprob-modal__btn--deny",
        cancelButton: "aprob-modal__btn aprob-modal__btn--cancel",
      },
    });
    if (decision.isConfirmed) {
      await enviar(s, "solicitud_pago_aprobar", { tipo });
      return;
    }
    if (!decision.isDenied) return;
    const rechazo = await Swal.fire({
      icon: "warning",
      title: "Rechazar solicitud",
      input: "textarea",
      inputLabel: "Motivo del rechazo",
      inputPlaceholder: "Indica qué debe corregir el solicitante",
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!rechazo.isConfirmed) return;
    await enviar(s, "solicitud_pago_rechazar", { tipo, motivo: rechazo.value || "" });
  }

  return { revisando, revisar };
}
