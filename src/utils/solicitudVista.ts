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
