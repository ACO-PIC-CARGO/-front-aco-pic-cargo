import { ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import type { AdminCredentials } from "@/types/seguridad";
import type { SolicitudCobro, SolicitudCobroBandeja, SoporteCobro } from "@/types/solicitudCobro";
import { askAdminCredentials, withAuthorization } from "@/utils/adminCredentials";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";
import { useRevisionSolicitudPago, type AreaRevision } from "@/composables/useRevisionSolicitudPago";

type SolicitudCobroFila = SolicitudCobro | SolicitudCobroBandeja;

const URL_MAIN = import.meta.env.VITE_URL_MAIN;

export const montoCobro = (monto: number | string, moneda: string | null) =>
  `${Number(monto || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda ?? ""}`.trim();

// Cobros sin aprobaciones: al enviarla queda "Pendiente por confirmar" y la rechaza Administración (04 / 01)
export const areaRechazoCobro = (codigoEstado: string | null | undefined): AreaRevision | null =>
  codigoEstado === "LISTO" ? "ADM" : null;

// Con aprobaciones (Administración o Gerencia), editar o eliminar pide la clave de un administrador
export const tieneAprobacionesCobro = (s: SolicitudCobroFila) =>
  !!(s.usuario_aprobadoadministracion || s.usuario_aprobadogerencia);

// Con ingreso registrado en Bancos no se edita ni elimina hasta eliminar ese movimiento
// Pago parcial: se cobra lo cargado (suma de los soportes), no toda la deuda del correlativo
export const montoCobrado = (s: { monto: number | string; monto_soportes?: number | string | null }) =>
  s.monto_soportes == null ? Number(s.monto || 0) : Number(s.monto_soportes);
export const esPagoParcial = (s: { monto: number | string; monto_soportes?: number | string | null }) =>
  s.monto_soportes != null && Number(s.monto_soportes) > 0 && Number(s.monto_soportes) < Number(s.monto || 0) - 0.004;

// Listados: una fila por soporte (pago cargado). Cada fila conserva la solicitud (estado, confirmación,
// acciones) y toma del soporte el monto, la cuenta, el voucher y su ingreso en Bancos.
export type FilaSoporteCobro<T> = T & { _soporte: SoporteCobro | null; _key: string; codigo_soporte?: string };
export function filasPorSoporte<T extends SolicitudCobroFila>(lista: T[]): FilaSoporteCobro<T>[] {
  return lista.flatMap((s) => {
    const soportes = s.soportes?.length ? s.soportes : [null];
    return soportes.map((sop) => {
      if (!sop) return { ...s, _soporte: null, _key: s.codigo };
      const registrado = !!sop.id_pagoingreso;
      const confirmado = !!sop.confirmadoflag;
      // estado del pago: en Bancos > confirmado > el de la solicitud (enviada = pendiente por confirmar)
      const codigo = registrado ? "COBRADO" : confirmado ? "CONFIRMADO" : s.codigo_estado === "CONFIRMADO" ? "LISTO" : s.codigo_estado;
      const estado = registrado ? "Registrado en Bancos" : confirmado ? "Confirmado" : codigo === "LISTO" ? "Pendiente por confirmar" : s.estado;
      return {
        ...s,
        _soporte: sop,
        _key: `${s.codigo}-${sop.codigo}`,
        codigo_soporte: sop.codigo,
        confirmadoflag: confirmado,
        fecha_ingreso: sop.fecha_ingreso ?? null,
        soporte_confirmacion_path: sop.soporte_confirmacion_path ?? null,
        soporte_confirmacion_nombre: sop.soporte_confirmacion_nombre ?? null,
        usuario_confirma: sop.usuario_confirma ?? null,
        fecha_confirmacion: sop.fecha_confirmacion ?? null,
        monto: sop.monto,
        monto_soportes: sop.monto,
        id_cuentabancaria: sop.id_cuentabancaria,
        cuenta: sop.cuenta,
        banco: sop.banco,
        nrocuenta: sop.nrocuenta,
        id_banco_origen: sop.id_banco_origen,
        banco_origen: sop.banco_origen,
        fechadeposito: sop.fechadeposito,
        numerooperacion: sop.numerooperacion,
        voucher_path: sop.voucher_path,
        voucher_nombre: sop.voucher_nombre,
        comentario: sop.comentario,
        id_pagoingreso: sop.id_pagoingreso,
        numerooperacion_ingreso: sop.numerooperacion_ingreso,
        soportes: [sop],
        soportes_total: 1,
        soportes_registrados: registrado ? 1 : 0,
        codigo_estado: codigo,
        estado,
      } as unknown as FilaSoporteCobro<T>;
    });
  });
}

// Rechazada: se corrige sin clave (pierde las aprobaciones y se revisa de nuevo); el backend valida los montos
export const editarPideClaveCobro = (s: SolicitudCobroFila) => tieneAprobacionesCobro(s) && s.codigo_estado !== "RECHAZADA";

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

// Bancos: un ingreso por pago cargado; queda pendiente mientras falte registrar alguno
export const faltaRegistrarCobro = (s: SolicitudCobroFila) =>
  (s.soportes_registrados ?? (s.id_pagoingreso ? 1 : 0)) < (s.soportes_total ?? 1);

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
        por <b>${montoCobro(montoCobrado(s), s.moneda)}</b>${esPagoParcial(s) ? ` (pago parcial de ${montoCobro(s.monto, s.moneda)})` : ""}. Quedará <b>pendiente por confirmar</b> hasta que Administración suba el soporte de confirmación.`,
      showCancelButton: true,
      confirmButtonText: "Enviar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    await ejecutar(s.codigo, "put", "solicitud_cobro_enviar");
  }

  /** Devuelve la clave del administrador si hace falta; undefined = cancelar; null = no se necesita */
  async function claveSiAprobada(s: SolicitudCobroFila, accion: "editarla" | "eliminarla"): Promise<AdminCredentials | null | undefined> {
    if (!(accion === "editarla" ? editarPideClaveCobro(s) : tieneAprobacionesCobro(s))) return null;
    return askAdminCredentials(
      `La solicitud de cobro ya tiene aprobación de Administración o Gerencia. Para ${accion}, escribe el usuario y la clave de un administrador.`,
    );
  }

  async function eliminar(s: SolicitudCobroFila) {
    if (avisarIngresoBancosCobro(s)) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Eliminar solicitud de cobro",
      html: `¿Eliminar la solicitud de cobro de <b>${s.cliente}</b> por <b>${montoCobro(montoCobrado(s), s.moneda)}</b>?
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

  // Aprobar o rechazar con el mismo modal que las solicitudes de pago
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
  // Abre Bancos > Nuevo Ingreso en otra pestaña al instante: esa pestaña genera el token
  // (sin pestaña en blanco ni botón cargando si el servidor demora)
  function registrarEnBancos(s: SolicitudCobroFila) {
    if (!faltaRegistrarCobro(s) && avisarIngresoBancosCobro(s)) return;
    // fila de un pago: se registra solo ese soporte (SCS-); si no, el siguiente confirmado de la solicitud
    const codigo = (s as { codigo_soporte?: string }).codigo_soporte ?? s.codigo;
    window.open(router.resolve({ name: "registroCobroDesdeSolicitud", params: { codigo } }).href, "_blank");
  }

  // Soporte de confirmación (Administración): solo se quita con la clave del Super administrador
  // y mientras el ingreso no esté registrado en Bancos
  async function eliminarConfirmacion(s: SolicitudCobroFila) {
    if (avisarIngresoBancosCobro(s)) return;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Eliminar soporte de confirmación",
      html: `${s.cliente}<br><b>${montoCobro(montoCobrado(s), s.moneda)}</b><br><br>La solicitud volverá a <b>Pendiente por confirmar</b>.`,
      showCancelButton: true,
      confirmButtonText: "Eliminar soporte",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return;
    const admin = await askAdminCredentials(
      "Ya se confirmó el ingreso: para eliminar el soporte de confirmación, escribe el usuario y la clave del Super administrador.",
    );
    if (!admin) return;
    await ejecutar(s.codigo, "put", "solicitud_cobro_confirmacion_eliminar", {
      ...withAuthorization(admin),
      codigo_soporte: (s as { codigo_soporte?: string }).codigo_soporte ?? null,
    });
  }

  // Eliminar un pago cargado (parcial). Si era el único se elimina la solicitud.
  async function eliminarSoporte(s: SolicitudCobroFila, soporte: SoporteCobro) {
    if (avisarIngresoBancosCobro(s)) return false;
    const ultimo = (s.soportes_total ?? 1) <= 1;
    const ok = await Swal.fire({
      icon: "warning",
      title: "Eliminar pago del cliente",
      html: `¿Eliminar el pago de <b>${montoCobro(soporte.monto, s.moneda)}</b> (operación ${soporte.numerooperacion ?? "—"})?
        ${ultimo ? "<br><br>Es el único pago cargado: también se elimina la solicitud de cobro." : ""}
        ${s.codigo_estado !== "BORRADOR" && !ultimo ? "<br><br>La solicitud volverá a quedar pendiente de envío." : ""}
        ${tieneAprobacionesCobro(s) ? "<br><br>Ya tiene aprobaciones: se pedirá la clave de un administrador." : ""}`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!ok.isConfirmed) return false;
    const admin = await claveSiAprobada(s, "eliminarla");
    if (admin === undefined) return false;
    return ejecutar(soporte.codigo, "put", "solicitud_cobro_soporte_eliminar", withAuthorization(admin));
  }

  return {
    procesando,
    eliminarSoporte,
    revisando: revision.revisando,
    enviar,
    eliminar,
    revisar,
    registrarEnBancos,
    claveSiAprobada,
    eliminarConfirmacion,
  };
}
