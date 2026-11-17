import { ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import type { AdminCredentials } from "@/types/seguridad";
import type { SolicitudCobro, SolicitudCobroBandeja } from "@/types/solicitudCobro";
import { askAdminCredentials, withAuthorization } from "@/utils/adminCredentials";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";
import { useRevisionSolicitudPago, type AreaRevision } from "@/composables/useRevisionSolicitudPago";

type SolicitudCobroFila = SolicitudCobro | SolicitudCobroBandeja;

const URL_MAIN = import.meta.env.VITE_URL_MAIN;

export const montoCobro = (monto: number | string, moneda: string | null) =>
  `${Number(monto || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda ?? ""}`.trim();

// Con aprobaciones (Administración o Gerencia), editar o eliminar pide la clave de un administrador
export const tieneAprobacionesCobro = (s: SolicitudCobroFila) =>
  !!(s.usuario_aprobadoadministracion || s.usuario_aprobadogerencia);

// Con ingreso registrado en Bancos no se edita ni elimina hasta eliminar ese movimiento
export function avisarIngresoBancosCobro(s: SolicitudCobroFila) {
  if (!s.id_pagoingreso) return false;
  Swal.fire({
    icon: "warning",
    title: "Ya está registrada en Bancos",
    html: `La solicitud de cobro de <b>${s.cliente}</b> ya tiene el ingreso${s.numerooperacion_ingreso ? ` N° <b>${s.numerooperacion_ingreso}</b>` : ""} en Bancos.<br><br>
      Elimine primero ese movimiento en <b>Bancos &gt; Listado Entradas</b>.`,
  });
  return true;
}

function avisarError(response: { tipomensaje?: string; mensaje?: string }) {
  Swal.fire({
    icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
    text: response.mensaje || CONNECTION_ERROR_MESSAGE,
  });
}

/** Acciones de una solicitud de cobro con las mismas reglas en Control de Gastos y en la bandeja */
export function useSolicitudCobro(alTerminar: () => unknown) {
  const router = useRouter();
  const procesando = ref<string | null>(null);

  async function ejecutar(codigo: string, metodo: "put" | "post", ruta: string, data: Record<string, unknown> = {}) {
    procesando.value = codigo;
    const response = await request({ method: metodo, url: URL_MAIN + ruta + "/" + codigo, data });
    procesando.value = null;
    if (!response.estadoflag) {
      avisarError(response);
      return false;
    }
    notifySuccess(response.mensaje);
    await alTerminar();
    return true;
  }

  async function enviar(s: SolicitudCobroFila) {
    const ok = await Swal.fire({
      icon: "question",
      title: "Enviar a Administración",
      html: `Se enviará la solicitud de cobro de <b>${s.cliente}</b>
        por <b>${montoCobro(s.monto, s.moneda)}</b> para que Administración y Gerencia confirmen el ingreso.`,
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    await ejecutar(s.codigo, "put", "solicitud_cobro_enviar");
  }

  /** Devuelve la clave del administrador si hace falta; undefined = cancelar; null = no se necesita */
  async function claveSiAprobada(s: SolicitudCobroFila, accion: "editarla" | "eliminarla"): Promise<AdminCredentials | null | undefined> {
    if (!tieneAprobacionesCobro(s)) return null;
    return askAdminCredentials(
      `La solicitud de cobro ya tiene aprobación de Administración o Gerencia. Para ${accion}, escribe el usuario y la clave de un administrador.`,
    );
  }

  async function eliminar(s: SolicitudCobroFila) {
    if (avisarIngresoBancosCobro(s)) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Eliminar solicitud de cobro",
      html: `¿Eliminar la solicitud de cobro de <b>${s.cliente}</b> por <b>${montoCobro(s.monto, s.moneda)}</b>?
        ${tieneAprobacionesCobro(s) ? "<br><br>Ya tiene aprobaciones: se pedirá la clave de un administrador." : ""}`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;
    const admin = await claveSiAprobada(s, "eliminarla");
    if (admin === undefined) return;
    await ejecutar(s.codigo, "put", "solicitud_cobro_eliminar", withAuthorization(admin));
  }

  // Confirmar (aprobar) o rechazar con el mismo modal que las solicitudes de pago
  const revision = useRevisionSolicitudPago(alTerminar, {
    rutaAprobar: "solicitud_cobro_aprobar",
    rutaRechazar: "solicitud_cobro_rechazar",
    etiquetaEntidad: "CLIENTE",
  });
  const revisar = (s: SolicitudCobroFila, tipo: AreaRevision) =>
    revision.revisar(
      { id: s.codigo, proveedor: s.cliente, id_proveedor: s.id_cliente, monto: s.monto, moneda: s.moneda },
      tipo,
    );

  // Bancos > Nuevo Ingreso precargado con la solicitud confirmada
  async function registrarEnBancos(s: SolicitudCobroFila) {
    if (avisarIngresoBancosCobro(s)) return;
    procesando.value = s.codigo;
    const response = await request<{ token: string }>({
      method: "put",
      url: URL_MAIN + "solicitud_cobro_transferir/" + s.codigo,
    });
    procesando.value = null;
    const token = response.estadoflag ? response.data[0]?.token : null;
    if (!token) {
      avisarError(response);
      return;
    }
    router.push({ name: "registroCobroSolicitud", params: { token } });
  }

  return { procesando, revisando: revision.revisando, enviar, eliminar, revisar, registrarEnBancos, claveSiAprobada };
}
