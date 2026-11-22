import { ref } from "vue";
import Swal from "sweetalert2";
import type { AdminCredentials } from "@/types/seguridad";
import { askAdminCredentials, withAuthorization } from "@/utils/adminCredentials";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";
import {
  avisoSolicitudConSoporte,
  confirmarEliminarSolicitudPago,
  confirmarEliminarSoporte,
  montoConMoneda,
} from "@/utils/solicitudPagoAvisos";

/** Lo mínimo de una solicitud de pago para editarla o eliminarla desde cualquier listado */
export interface SolicitudPagoAccion {
  /** solicitud del Reporte de Cuentas con varios expedientes: sus datos no se editan */
  multiexpedienteflag?: boolean;
  /** expedientes amarrados a la solicitud (solo la del reporte) */
  expedientes_solicitud?: string | null;
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
  tieneSoporteSolicitud(s)
    ? `La solicitud ya tiene soporte de pago (ya se pagó). Para ${accion}, escribe el usuario y la clave del Super administrador.`
    : `La solicitud ya tiene aprobación de Administración o Gerencia. Para ${accion}, escribe el usuario y la clave de un administrador.`;

/**
 * Confirmación antes de eliminar: proveedor, monto, aprobaciones y soporte de pago.
 * Con aprobaciones o soporte avisa que se pedirá la clave del Super administrador.
 */
export function confirmarEliminarSolicitud(s: SolicitudPagoAccion, proveedor = s.proveedor) {
  return confirmarEliminarSolicitudPago({
    proveedor: proveedor ?? "",
    idProveedor: s.id_proveedor,
    monto: montoConMoneda(s.monto, s.moneda),
    aprobadaAdministracion: !!(s.aprobadoadministracionflag || s.usuario_aprobadoadministracion),
    aprobadaGerencia: !!(s.aprobadogerenciaflag || s.usuario_aprobadogerencia),
    usuarioAdministracion: s.usuario_aprobadoadministracion,
    usuarioGerencia: s.usuario_aprobadogerencia,
    soporte: tieneSoporteSolicitud(s),
    pideClave: tieneAprobacionesSolicitud(s),
  });
}

const pedirClave = (s: SolicitudPagoAccion, accion: "editarla" | "eliminarla") => askAdminCredentials(mensajeClaveSolicitud(s, accion));

const pedirClaveSoporte = () =>
  askAdminCredentials("Ya se pagó: para eliminar el soporte de pago, escribe el usuario y la clave del Super administrador.");

/** Elimina el soporte de pago con la clave ya validada; true si se eliminó */
async function borrarSoporte(s: SolicitudPagoAccion, admin: AdminCredentials) {
  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_soporte_eliminar/" + s.id,
    data: withAuthorization(admin),
  });
  if (!response.estadoflag) {
    Swal.fire({ icon: "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
    return false;
  }
  notifySuccess(response.mensaje);
  return true;
}

/**
 * Con soporte de pago la solicitud no se elimina directo: se avisa "No se puede eliminar" y,
 * si el usuario lo pide, primero se elimina el soporte (clave del Super administrador).
 * Devuelve la solicitud ya sin soporte y la clave validada (sirve también para eliminar la solicitud),
 * o null si no se debe seguir.
 */
export async function quitarSoporteAntesDeEliminar<T extends SolicitudPagoAccion>(
  s: T,
): Promise<{ solicitud: T; admin?: AdminCredentials; soporteEliminado: boolean } | null> {
  if (!tieneSoporteSolicitud(s)) return { solicitud: s, soporteEliminado: false };
  if (!(await avisoSolicitudConSoporte())) return null;
  const admin = await pedirClaveSoporte();
  if (!admin || !(await borrarSoporte(s, admin))) return null;
  return { solicitud: { ...s, pagadoflag: false, soporte_path: null }, admin, soporteEliminado: true };
}

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

  async function eliminar(original: SolicitudPagoAccion) {
    if (avisarSalidaBancosSolicitud(original)) return;
    // con soporte de pago: primero se elimina el soporte
    const previo = await quitarSoporteAntesDeEliminar(original);
    if (!previo) return;
    const s = previo.solicitud;
    if (!(await confirmarEliminarSolicitud(s))) {
      if (previo.soporteEliminado) await alTerminar();
      return;
    }
    // la clave del Super administrador ya validada al quitar el soporte sirve para las aprobaciones
    let admin = previo.admin;
    if (!admin && tieneAprobacionesSolicitud(s)) {
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
      if (previo.soporteEliminado) await alTerminar();
      return;
    }
    notifySuccess(response.mensaje);
    await alTerminar();
  }

  // Soporte de pago: solo se elimina con la clave del Super administrador y sin salida en Bancos
  const eliminandoSoporte = ref<number | null>(null);
  async function eliminarSoporte(s: SolicitudPagoAccion) {
    if (avisarSalidaBancosSolicitud(s)) return;
    const confirmado = await confirmarEliminarSoporte({
      proveedor: s.proveedor,
      idProveedor: s.id_proveedor,
      monto: montoConMoneda(s.monto, s.moneda),
    });
    if (!confirmado) return;
    const admin = await pedirClaveSoporte();
    if (!admin) return;
    eliminandoSoporte.value = s.id;
    const ok = await borrarSoporte(s, admin);
    eliminandoSoporte.value = null;
    if (ok) await alTerminar();
  }

  return { dialogEditar, solicitudEditar, adminEditar, eliminando, editar, eliminar, eliminandoSoporte, eliminarSoporte };
}
