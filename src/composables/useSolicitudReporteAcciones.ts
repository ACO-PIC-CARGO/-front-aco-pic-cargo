import { ref } from "vue";
import Swal from "sweetalert2";
import {
  askAdminCredentials,
  PERMISOS_AUTORIZA,
} from "@/utils/adminCredentials";
import { avisarOrigenSolicitud } from "@/utils/solicitudOrigen";
import {
  CONNECTION_ERROR_MESSAGE,
  notifySuccess,
  request,
} from "@/utils/request";
import type { AdminCredentials } from "@/types/seguridad";
import type {
  EntidadSolicitudReporte,
  ExpedienteSolicitudReporte,
  SolicitudReporteVer,
  TipoSolicitudReporte,
} from "@/types/solicitudReporte";

// Reporte de Cuentas por Cobrar / por Pagar: ver, editar y eliminar la solicitud registrada desde el reporte.
// Editar y eliminar piden siempre la clave de un administrador. El modal es el mismo de "Solicitar"
// (SolicitudReporteDialog) en una sola vista, sin pasos.
export function useSolicitudReporteAcciones(
  tipo: TipoSolicitudReporte,
  recargar: () => unknown
) {
  const solicitud = ref<SolicitudReporteVer | null>(null);
  const modo = ref<"ver" | "editar">("ver");
  const autorizacion = ref<AdminCredentials | null>(null);
  const entidad = ref<EntidadSolicitudReporte | null>(null);
  const abierto = ref(false);
  const eliminando = ref<number | null>(null);

  const etiqueta = tipo === "pago" ? "pago" : "cobro";
  const datosSolicitud = (
    sol: ExpedienteSolicitudReporte
  ): SolicitudReporteVer => ({
    id: sol.id_solicitud,
    codigo: tipo === "cobro" ? sol.codigo_solicitud : null,
  });

  function ver(sol: ExpedienteSolicitudReporte, ent: EntidadSolicitudReporte) {
    solicitud.value = datosSolicitud(sol);
    entidad.value = ent;
    modo.value = "ver";
    autorizacion.value = null;
    abierto.value = true;
  }

  async function editar(
    sol: ExpedienteSolicitudReporte,
    ent: EntidadSolicitudReporte
  ) {
    // la pedida desde Control de Gastos solo se edita ahí
    if (avisarOrigenSolicitud(sol, "adm", "editar", tipo)) return;
    const admin = await askAdminCredentials(
      `Para editar la solicitud de ${etiqueta} ${
        sol.codigo_solicitud ?? ""
      }, escribe el usuario y la clave de un administrador. ` +
        "Al guardar, vuelve a pasar por las aprobaciones.",
      tipo === "pago"
        ? PERMISOS_AUTORIZA.solicitudPagoReporteEditar
        : PERMISOS_AUTORIZA.solicitudCobroReporteEditar
    );
    if (!admin) return;
    solicitud.value = datosSolicitud(sol);
    entidad.value = ent;
    modo.value = "editar";
    autorizacion.value = admin;
    abierto.value = true;
  }

  async function eliminar(sol: ExpedienteSolicitudReporte) {
    if (!sol.id_solicitud) return;
    if (avisarOrigenSolicitud(sol, "adm", "eliminar", tipo)) return;
    const admin = await askAdminCredentials(
      `Para eliminar la solicitud de ${etiqueta} ${
        sol.codigo_solicitud ?? ""
      } (todos sus expedientes), ` +
        "escribe el usuario y la clave de un administrador.",
      tipo === "pago"
        ? PERMISOS_AUTORIZA.solicitudPagoEliminar
        : PERMISOS_AUTORIZA.solicitudCobroEliminar
    );
    if (!admin) return;
    eliminando.value = sol.id_solicitud;
    const response = await request({
      method: "put",
      url:
        import.meta.env.VITE_URL_MAIN +
        (tipo === "pago"
          ? "solicitud_pago_eliminar/" + sol.id_solicitud
          : "solicitud_cobro_eliminar/" + sol.codigo_solicitud),
      data: { autorizacion: admin },
    });
    eliminando.value = null;
    if (!response.estadoflag) {
      Swal.fire({
        icon: response.tipomensaje === "TMSGERR" ? "error" : "warning",
        text: response.mensaje || CONNECTION_ERROR_MESSAGE,
      });
      return;
    }
    notifySuccess(response.mensaje);
    await recargar();
  }

  return {
    abierto,
    solicitud,
    modo,
    autorizacion,
    entidad,
    eliminando,
    ver,
    editar,
    eliminar,
  };
}
