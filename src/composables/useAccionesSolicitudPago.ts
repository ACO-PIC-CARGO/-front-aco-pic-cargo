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
}

// Con aprobación de Administración o Gerencia, editar o eliminar pide la clave de un administrador
export const tieneAprobacionesSolicitud = (s: SolicitudPagoAccion) =>
  !!(s.aprobadoadministracionflag || s.aprobadogerenciaflag || s.usuario_aprobadoadministracion || s.usuario_aprobadogerencia);

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

const pedirClave = (accion: "editarla" | "eliminarla") =>
  askAdminCredentials(
    `La solicitud ya tiene aprobación de Administración o Gerencia. Para ${accion}, escribe el usuario y la clave de un administrador.`,
  );

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
      const admin = await pedirClave("editarla");
      if (!admin) return;
      adminEditar.value = admin;
    }
    solicitudEditar.value = s;
    dialogEditar.value = true;
  }

  async function eliminar(s: SolicitudPagoAccion) {
    if (avisarSalidaBancosSolicitud(s)) return;
    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      html: `¿Eliminar la solicitud de pago N° <b>${s.id}</b> de <b>${s.proveedor}</b>?`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!isConfirmed) return;
    let admin: AdminCredentials | undefined;
    if (tieneAprobacionesSolicitud(s)) {
      admin = await pedirClave("eliminarla");
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
