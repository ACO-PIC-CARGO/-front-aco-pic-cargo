// Ayudas de presentación de las solicitudes de pago / cobro (Bancos y Control de Gastos).

/** "administracionpe@pic-cargo.com" -> "administracionpe" (el usuario ocupa menos en las celdas) */
export function usuarioCorto<T extends string | null | undefined>(usuario: T): T {
  if (!usuario) return usuario;
  return usuario.split("@")[0] as T;
}

/** solicitud del Reporte de Cuentas por Pagar / Cobrar con más de un expediente (o correlativo):
 *  las bandejas los mandan separados por coma */
export function tieneVariosExpedientes(s: {
  multiexpedienteflag?: boolean | null;
  expediente?: string | null;
  correlativo?: string | null;
  expedientes_solicitud?: string | null;
}): boolean {
  return !!s.multiexpedienteflag
    && [s.expediente, s.correlativo, s.expedientes_solicitud].some((texto) => `${texto ?? ""}`.includes(","));
}

// "Editado en Bancos": la salida / ingreso se registró editado (abono parcial u otro monto, autorizado por un
// administrador); en los listados va el motivo del error en lugar del N° de operación
type OperacionBancos = { editadobancoflag?: boolean | null; motivo_edicion_banco?: string | null };
export const editadoEnBancos = (s: OperacionBancos) => !!s.editadobancoflag;
export function operacionBanco(s: OperacionBancos, tipo: "Salida" | "Ingreso", numero: string | null | undefined): string {
  if (s.editadobancoflag) return `Editado en Bancos: ${s.motivo_edicion_banco?.trim() || "sin motivo"}`;
  return `${tipo} N° ${numero ?? ""}`.trim();
}
