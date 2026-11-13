import { ref } from "vue";
import Swal from "sweetalert2";
import { sessionUser } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

export type AreaRevision = "ADM" | "GER";

// Quién revisa cada paso de una solicitud de pago (position_code de la sesión).
// El backend valida lo mismo en function_solicitudpago_rol_revision.
export const PERFIL_REVISION: Record<AreaRevision, string> = { ADM: "04", GER: "01" };

export function tienePerfilRevision(tipo: AreaRevision): boolean {
  try {
    return (sessionUser().position_code ?? []).map(String).includes(PERFIL_REVISION[tipo]);
  } catch {
    return false;
  }
}

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
    const area = tipo === "ADM" ? "Administración" : "Gerencia";
    const monto = Number(s.monto || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const decision = await Swal.fire({
      icon: "question",
      title: `Revisión de ${area}`,
      html: `¿Deseas <b>aprobar</b> o <b>rechazar</b> la solicitud de <b>${s.proveedor} (${s.id_proveedor})</b> por <b>${monto} ${s.moneda ?? ""}</b>?`,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Aprobar",
      denyButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#1e5bd8",
      denyButtonColor: "#d33",
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
