import Swal from "sweetalert2";

// Una solicitud solo se edita o elimina donde se creó:
//  - multiexpedienteflag = true: se pidió desde el Reporte de Cuentas por Cobrar / Pagar (Administración)
//  - multiexpedienteflag = false: se pidió desde Control de Gastos
// Si se intenta desde el otro lado, se avisa dónde hacerlo.

export type OrigenSolicitud = "cg" | "adm";
export type AccionSolicitud = "editar" | "eliminar";
export type TipoSolicitud = "pago" | "cobro";

export const origenSolicitud = (s: { multiexpedienteflag?: boolean | null }): OrigenSolicitud =>
  s.multiexpedienteflag ? "adm" : "cg";

export function mensajeOrigenSolicitud(origen: OrigenSolicitud, accion: AccionSolicitud, tipo: TipoSolicitud) {
  const verbo = accion === "editar" ? "editar" : "eliminar";
  return origen === "adm"
    ? {
      titulo: `No se puede ${verbo}`,
      texto: "La solicitud fue solicitada por Administración desde el Reporte de Cuentas por "
        + `${tipo === "pago" ? "Pagar" : "Cobrar"}. Comuníquese con el área administrativa.`,
    }
    : {
      titulo: `No se puede ${verbo}`,
      texto: `La solicitud fue solicitada por Control de Gastos. Revise Solicitudes de ${tipo === "pago" ? "Pago" : "Cobro"} Pendiente.`,
    };
}

/** true si la solicitud es del otro lado (ya se mostró el aviso): el llamador no debe seguir */
export function avisarOrigenSolicitud(
  s: { multiexpedienteflag?: boolean | null } | null | undefined,
  desde: OrigenSolicitud,
  accion: AccionSolicitud,
  tipo: TipoSolicitud,
): boolean {
  if (!s) return false;
  const origen = origenSolicitud(s);
  if (origen === desde) return false;
  const { titulo, texto } = mensajeOrigenSolicitud(origen, accion, tipo);
  void Swal.fire({ icon: "info", title: titulo, text: texto, confirmButtonText: "Entendido" });
  return true;
}
