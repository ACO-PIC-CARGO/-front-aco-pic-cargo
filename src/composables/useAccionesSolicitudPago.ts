import { ref } from "vue";
import Swal from "sweetalert2";
import type { AdminCredentials } from "@/types/seguridad";
import { askAdminCredentials, withAuthorization } from "@/utils/adminCredentials";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

/** Lo mínimo de una solicitud de pago para editarla o eliminarla desde cualquier listado */
export interface SolicitudPagoAccion {
  id: number;
  id_proveedor: number;
  proveedor: string;
  monto: number | string;
  moneda: string | null;
  codigo_tipopago?: string | null;
  codigopago?: string | null;
  comentario?: string | null;
  nrocuenta?: string | null;
  aprobadoadministracionflag?: boolean | null;
  aprobadogerenciaflag?: boolean | null;
  usuario_aprobadoadministracion?: string | null;
  usuario_aprobadogerencia?: string | null;
  id_pagoegreso?: number | string | null;
  numerooperacion_pago?: string | null;
  pagadoflag?: boolean | null;
  soporte_path?: string | null;
}

const tieneAprobaciones = (s: SolicitudPagoAccion) =>
  !!(s.aprobadoadministracionflag || s.aprobadogerenciaflag || s.usuario_aprobadoadministracion || s.usuario_aprobadogerencia);

// Con soporte de pago cargado
export const tieneSoporteSolicitud = (s: SolicitudPagoAccion) => !!(s.pagadoflag || s.soporte_path);

// Con aprobaciones (Administración o Gerencia) o con soporte de pago, editar o eliminar pide la clave de un administrador
export const tieneAprobacionesSolicitud = (s: SolicitudPagoAccion) => tieneAprobaciones(s) || tieneSoporteSolicitud(s);

// Con salida registrada en Bancos no se edita ni elimina hasta eliminar ese movimiento
export const tieneSalidaBancosSolicitud = (s: SolicitudPagoAccion) => !!s.id_pagoegreso;

export function avisarSalidaBancosSolicitud(s: SolicitudPagoAccion) {
  if (!tieneSalidaBancosSolicitud(s)) return false;
  Swal.fire({
    icon: "warning",
    title: "Ya está pagada en Bancos",
    html: `La solicitud de pago N° <b>${s.id}</b> ya tiene la salida${s.numerooperacion_pago ? ` N° <b>${s.numerooperacion_pago}</b>` : ""} en Bancos.<br><br>
      Elimine primero ese movimiento en <b>Bancos &gt; Salidas</b>.`,
  });
  return true;
}

export const mensajeClaveSolicitud = (s: SolicitudPagoAccion, accion: "editarla" | "eliminarla") =>
  `La solicitud ya tiene ${tieneSoporteSolicitud(s) ? "soporte de pago" : "aprobación de Administración o Gerencia"}. Para ${accion}, escribe el usuario y la clave de un administrador.`;

const escapar = (texto: string) =>
  texto.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Confirmación antes de eliminar. Si ya tiene soporte de pago o aprobaciones, el aviso lo dice
 * en grande ("YA TIENE ...") antes de pedir la clave de un administrador.
 */
export async function confirmarEliminarSolicitud(s: SolicitudPagoAccion, proveedor = s.proveedor) {
  const pregunta = `¿Eliminar la solicitud de pago N° <b>${s.id}</b> de <b>${escapar(proveedor ?? "")}</b>?`;
  if (!tieneAprobacionesSolicitud(s)) {
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      html: pregunta,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    return isConfirmed;
  }
  const usuario = (u?: string | null) => (u ? ` <span style="color:#475569">(${escapar(u)})</span>` : "");
  const items = [
    tieneSoporteSolicitud(s) && "Soporte de pago cargado",
    (s.aprobadoadministracionflag || s.usuario_aprobadoadministracion) &&
      `Aprobada por Administración${usuario(s.usuario_aprobadoadministracion)}`,
    (s.aprobadogerenciaflag || s.usuario_aprobadogerencia) && `Aprobada por Gerencia${usuario(s.usuario_aprobadogerencia)}`,
  ].filter(Boolean);
  const { isConfirmed } = await Swal.fire({
    icon: "error",
    title: "¡Atención! YA TIENE",
    html: `<ul style="margin:0 auto 14px;padding:12px 16px;max-width:360px;list-style:none;text-align:left;
        border:2px solid #f87171;border-radius:12px;background:#fef2f2;color:#991b1b;font-weight:700;line-height:1.9">
        ${items.map((i) => `<li>⚠ ${i}</li>`).join("")}
      </ul>
      ${pregunta}<br><small style="color:#64748b">Se necesitará la clave de un administrador.</small>`,
    showCancelButton: true,
    focusCancel: true,
    confirmButtonText: "Sí, eliminar de todos modos",
    cancelButtonText: "No, cancelar",
    confirmButtonColor: "#d33",
  });
  return isConfirmed;
}

const pedirClave = (s: SolicitudPagoAccion, accion: "editarla" | "eliminarla") => askAdminCredentials(mensajeClaveSolicitud(s, accion));

/** Editar / eliminar una solicitud de pago con las mismas reglas en todos los listados */
export function useAccionesSolicitudPago(alTerminar: () => unknown) {
  const dialogEditar = ref(false);
  const solicitudEditar = ref<SolicitudPagoAccion | null>(null);
  const adminEditar = ref<AdminCredentials | null>(null);
  const eliminando = ref<number | null>(null);

  async function editar(s: SolicitudPagoAccion) {
    if (avisarSalidaBancosSolicitud(s)) return;
    adminEditar.value = null;
    if (tieneAprobacionesSolicitud(s)) {
      const admin = await pedirClave(s, "editarla");
      if (!admin) return;
      adminEditar.value = admin;
    }
    solicitudEditar.value = s;
    dialogEditar.value = true;
  }

  async function eliminar(s: SolicitudPagoAccion) {
    if (avisarSalidaBancosSolicitud(s)) return;
    if (!(await confirmarEliminarSolicitud(s))) return;
    let admin: AdminCredentials | undefined;
    if (tieneAprobacionesSolicitud(s)) {
      admin = await pedirClave(s, "eliminarla");
      if (!admin) return;
    }
    eliminando.value = s.id;
    const response = await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_eliminar/" + s.id,
      data: withAuthorization(admin),
    });
    eliminando.value = null;
    if (!response.estadoflag) {
      Swal.fire({ icon: "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
      return;
    }
    notifySuccess(response.mensaje);
    await alTerminar();
  }

  return { dialogEditar, solicitudEditar, adminEditar, eliminando, editar, eliminar };
}
